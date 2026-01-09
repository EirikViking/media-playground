/**
 * Image Upload Utilities for R2
 * Handles thumbnail generation, upload to Worker, and progress tracking
 */

import { CloudAsset, UPLOAD_LIMITS } from '../types';
import { api } from './api';

export interface UploadProgress {
    assetId: string;
    fileName: string;
    stage: 'preparing' | 'uploading-original' | 'generating-thumb' | 'uploading-thumb' | 'committing' | 'done' | 'error';
    progress: number; // 0-100
    error?: string;
}

export type UploadProgressCallback = (progress: UploadProgress) => void;

/**
 * Generate thumbnail from image file using Canvas
 */
export async function generateThumbnail(file: File, maxWidth = UPLOAD_LIMITS.thumbWidth): Promise<{ blob: Blob; width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            // Calculate dimensions
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            // Create canvas and draw
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve({ blob, width: img.width, height: img.height });
                    } else {
                        reject(new Error('Failed to create thumbnail blob'));
                    }
                },
                'image/webp',
                UPLOAD_LIMITS.thumbQuality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * Generate thumbnail from video file by capturing a frame
 */
export async function generateVideoThumbnail(file: File, maxWidth = UPLOAD_LIMITS.thumbWidth): Promise<{ blob: Blob; width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);

        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
            // Seek to 0.5 seconds or 10% of duration
            const seekTime = Math.min(0.5, video.duration * 0.1);
            video.currentTime = seekTime;
        };

        video.onseeked = () => {
            try {
                // Calculate dimensions
                let width = video.videoWidth;
                let height = video.videoHeight;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                // Create canvas and draw frame
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(url);
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(video, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        URL.revokeObjectURL(url);
                        if (blob) {
                            resolve({ blob, width: video.videoWidth, height: video.videoHeight });
                        } else {
                            reject(new Error('Failed to create video thumbnail blob'));
                        }
                    },
                    'image/jpeg',
                    0.8
                );
            } catch (e) {
                URL.revokeObjectURL(url);
                reject(e);
            }
        };

        video.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load video'));
        };

        video.src = url;
    });
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    if (!UPLOAD_LIMITS.allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type: ${file.type}. Allowed: ${UPLOAD_LIMITS.allowedTypes.join(', ')}`
        };
    }

    if (file.size > UPLOAD_LIMITS.maxFileSize) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        const maxMB = (UPLOAD_LIMITS.maxFileSize / 1024 / 1024).toFixed(0);
        return {
            valid: false,
            error: `File too large: ${sizeMB}MB. Maximum: ${maxMB}MB`
        };
    }

    return { valid: true };
}

/**
 * Upload a single image to R2 via Worker
 */
export async function uploadImage(
    projectId: string,
    file: File,
    onProgress?: UploadProgressCallback
): Promise<{ success: true; asset: CloudAsset } | { success: false; error: string }> {
    const assetId = crypto.randomUUID();

    console.log(`[Upload] Starting upload for ${file.name}`, { projectId, assetId, size: file.size });

    const updateProgress = (stage: UploadProgress['stage'], progress: number, error?: string) => {
        onProgress?.({
            assetId,
            fileName: file.name,
            stage,
            progress,
            error,
        });
    };

    try {
        // Stage 1: Prepare
        updateProgress('preparing', 0);

        const validation = validateFile(file);
        if (!validation.valid) {
            updateProgress('error', 0, validation.error);
            return { success: false, error: validation.error! };
        }

        // Stage 2: Upload original
        updateProgress('uploading-original', 10);

        const originalKey = `${projectId}/${assetId}/original`;
        const originalResult = await api.uploadFile(projectId, assetId, 'original', file);

        if (originalResult.error) {
            updateProgress('error', 10, originalResult.error);
            return { success: false, error: originalResult.error };
        }

        updateProgress('uploading-original', 40);

        // Stage 3: Generate thumbnail
        updateProgress('generating-thumb', 50);

        let thumbBlob: Blob;
        let width = 0;
        let height = 0;

        try {
            if (file.type.startsWith('image/')) {
                const thumbResult = await generateThumbnail(file);
                thumbBlob = thumbResult.blob;
                width = thumbResult.width;
                height = thumbResult.height;
            } else if (file.type.startsWith('video/')) {
                try {
                    const thumbResult = await generateVideoThumbnail(file);
                    thumbBlob = thumbResult.blob;
                    width = thumbResult.width;
                    height = thumbResult.height;
                } catch (videoError) {
                    console.warn('Video thumbnail generation failed, using placeholder:', videoError);
                    // Create a small placeholder image
                    const canvas = document.createElement('canvas');
                    canvas.width = 320;
                    canvas.height = 180;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.fillStyle = '#1e293b';
                        ctx.fillRect(0, 0, 320, 180);
                        ctx.fillStyle = '#64748b';
                        ctx.font = '48px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('🎬', 160, 90);
                    }
                    thumbBlob = await new Promise & lt; Blob & gt; ((resolve, reject) =& gt; {
                        canvas.toBlob((blob) =& gt; {
                            if (blob) resolve(blob);
                            else reject(new Error('Failed to create placeholder'));
                        }, 'image/jpeg', 0.8);
                    });
                    width = 320;
                    height = 180;
                }
            } else {
                // For audio, create a placeholder thumbnail
                const canvas = document.createElement('canvas');
                canvas.width = 320;
                canvas.height = 320;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#7c3aed';
                    ctx.fillRect(0, 0, 320, 320);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '64px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🎵', 160, 160);
                }
                thumbBlob = await new Promise & lt; Blob & gt; ((resolve, reject) =& gt; {
                    canvas.toBlob((blob) =& gt; {
                        if (blob) resolve(blob);
                        else reject(new Error('Failed to create placeholder'));
                    }, 'image/jpeg', 0.8);
                });
                width = 320;
                height = 320;
            }
        } catch (e) {
            const error = e instanceof Error ? e.message : 'Thumbnail generation failed';
            updateProgress('error', 50, error);
            return { success: false, error };
        }

        // Stage 4: Upload thumbnail
        updateProgress('uploading-thumb', 60);

        const thumbKey = `${projectId}/${assetId}/thumb`;
        const thumbFile = new File([thumbBlob], `${assetId}-thumb.webp`, { type: 'image/webp' });
        // Only upload thumb if it's an image, otherwise we might skip or upload dummy
        // For simplicity, we upload the dummy so the key exists
        const thumbResult = await api.uploadFile(projectId, assetId, 'thumb', thumbFile);

        if (thumbResult.error) {
            updateProgress('error', 60, thumbResult.error);
            return { success: false, error: thumbResult.error };
        }

        updateProgress('uploading-thumb', 80);

        // Stage 5: Commit asset metadata
        updateProgress('committing', 90);

        const asset: CloudAsset = {
            assetId,
            originalKey,
            thumbKey,
            contentType: file.type,
            byteSize: file.size,
            width,
            height,
            fileName: file.name,
            createdAt: new Date().toISOString(),
        };

        const commitResult = await api.commitAsset(projectId, asset);

        if (commitResult.error) {
            updateProgress('error', 90, commitResult.error);
            return { success: false, error: commitResult.error };
        }

        // Done!
        updateProgress('done', 100);

        return { success: true, asset };
    } catch (e) {
        const error = e instanceof Error ? e.message : 'Unknown error';
        updateProgress('error', 0, error);
        return { success: false, error };
    }
}

/**
 * Upload multiple images with aggregate progress
 */
export async function uploadImages(
    projectId: string,
    files: File[],
    onProgress?: (completed: number, total: number, current?: UploadProgress) => void
): Promise<{
    successful: CloudAsset[];
    failed: Array<{ fileName: string; error: string }>;
}> {
    const successful: CloudAsset[] = [];
    const failed: Array<{ fileName: string; error: string }> = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const result = await uploadImage(projectId, file, (progress) => {
            onProgress?.(i, files.length, progress);
        });

        if (result.success) {
            successful.push(result.asset);
        } else {
            failed.push({ fileName: file.name, error: result.error });
        }

        onProgress?.(i + 1, files.length);
    }

    return { successful, failed };
}

/**
 * Get asset URL for display
 */
export function getAssetUrl(projectId: string, assetId: string, kind: 'original' | 'thumb'): string {
    return api.getAssetUrl(projectId, assetId, kind);
}
