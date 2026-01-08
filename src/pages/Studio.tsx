import { useState, useCallback, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MediaItem, CloudAsset, ProjectJsonData, UPLOAD_LIMITS } from '../types';
import { useProject } from '../hooks/useProject';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from '../components/Button';
import { DropZone } from '../components/DropZone';
import { MediaGrid } from '../components/MediaGrid';
import { MediaDetail } from '../components/MediaDetail';
import { CollageCreator } from '../components/CollageCreator';
import { ProjectsPanel } from '../components/ProjectsPanel';
import { ShareButton } from '../components/ShareButton';
import { UploadProgressPanel } from '../components/UploadProgressPanel';
import { ArrowLeft, Trash2, Upload, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { fileToDataUrl } from '../utils/storage';
import { api } from '../utils/api';
import { uploadImages, UploadProgress, validateFile, getAssetUrl } from '../utils/upload';

export const Studio = () => {
  const { project, addItem, updateItem, removeItem, createNewProject, setProject } = useProject();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState(project.name);
  const [searchParams, setSearchParams] = useSearchParams();

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCompleted, setUploadCompleted] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadCurrent, setUploadCurrent] = useState<UploadProgress | undefined>();
  const [uploadErrors, setUploadErrors] = useState<Array<{ fileName: string; error: string }>>([]);

  // Load shared project from URL on mount
  useEffect(() => {
    const projectIdFromUrl = searchParams.get('project');
    if (projectIdFromUrl && projectIdFromUrl !== currentProjectId) {
      console.log('[Studio] Loading shared project:', projectIdFromUrl);
      handleLoadProject(projectIdFromUrl);
    }
  }, [searchParams]);

  const handleFilesAdded = async (files: File[]) => {
    // Separate images, videos, and audio
    const mediaFiles = files.filter(f =>
      f.type.startsWith('image/') ||
      f.type.startsWith('video/') ||
      f.type.startsWith('audio/')
    );
    const unsupportedFiles = files.filter(f => !mediaFiles.includes(f));

    if (unsupportedFiles.length > 0) {
      alert(`${unsupportedFiles.length} files skipped. Only images, videos, and audio are supported.`);
    }

    for (const file of mediaFiles) {
      try {
        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
          console.warn(`Skipping ${file.name}: ${validation.error}`);
          continue;
        }

        const dataUrl = await fileToDataUrl(file);
        let type: MediaItem['type'] = 'image';
        if (file.type.startsWith('video/')) type = 'video';
        if (file.type.startsWith('audio/')) type = 'audio';

        const item: MediaItem = {
          id: crypto.randomUUID(),
          type,
          file,
          url: dataUrl,
          dataUrl,
          title: file.name,
          tags: [],
          notes: '',
          createdAt: Date.now(),
          uploadStatus: 'pending',
        };
        addItem(item);
      } catch (error) {
        console.error('Failed to process file:', file.name, error);
      }
    }
  };

  const handleItemUpdate = (updates: Partial<MediaItem>) => {
    if (selectedItem) {
      updateItem(selectedItem.id, updates);
      setSelectedItem({ ...selectedItem, ...updates });
    }
  };

  const handleNewProject = () => {
    if (project.items.length > 0) {
      if (window.confirm('Start fresh? This will clear your current masterpiece.')) {
        createNewProject();
        setCurrentProjectId(null);
        setProjectTitle('Untitled Project');
        setSearchParams({});
      }
    } else {
      createNewProject();
      setCurrentProjectId(null);
      setProjectTitle('Untitled Project');
      setSearchParams({});
    }
  };

  // Get pending upload items (files that are not yet uploaded)
  const pendingUploads = project.items.filter(
    item => item.file && item.uploadStatus !== 'uploaded'
  );

  // Handle upload of pending images
  const handleUploadImages = async () => {
    let projectId = currentProjectId;

    if (!projectId) {
      // Need to save project first
      const saveResult = await handleSaveProject(null);
      if (!saveResult) {
        alert('Please save the project first before uploading images.');
        return;
      }
      projectId = saveResult.id;
    }

    const filesToUpload = pendingUploads
      .filter(item => item.file)
      .map(item => ({ id: item.id, file: item.file! }));

    if (filesToUpload.length === 0) return;

    // Check limit
    const existingAssets = project.items.filter(i => i.cloudAsset).length;
    if (existingAssets + filesToUpload.length > UPLOAD_LIMITS.maxAssetsPerProject) {
      alert(`Maximum ${UPLOAD_LIMITS.maxAssetsPerProject} images per project. You have ${existingAssets} uploaded.`);
      return;
    }

    setIsUploading(true);
    setUploadCompleted(0);
    setUploadTotal(filesToUpload.length);
    setUploadErrors([]);

    // Mark items as uploading
    filesToUpload.forEach(({ id }) => {
      updateItem(id, { uploadStatus: 'uploading' });
    });

    const result = await uploadImages(
      projectId,
      filesToUpload.map(f => f.file),
      (completed, total, current) => {
        setUploadCompleted(completed);
        setUploadTotal(total);
        setUploadCurrent(current);
      }
    );

    // Update items with results
    // Update items with results
    result.successful.forEach(asset => {
      // Find matching item by fileName
      const item = project.items.find(i => i.file?.name === asset.fileName);
      if (item) {
        updateItem(item.id, {
          cloudAsset: asset,
          uploadStatus: 'uploaded',
          // Note: We intentionally DO NOT update 'url' or 'thumbUrl' here.
          // We keep the local dataUrl/blobUrl for immediate, reliable display in the current session.
          // The 'cloudAsset' property is sufficient to mark it as synced.
          // On next project load, URLs will be constructed from the cloudAsset data.
        });
      }
    });

    result.failed.forEach(failure => {
      const item = project.items.find(i => i.file?.name === failure.fileName);
      if (item) {
        updateItem(item.id, {
          uploadStatus: 'error',
          uploadError: failure.error,
        });
      }
    });

    setUploadErrors(result.failed);
    setIsUploading(false);
  };

  // Prepare project data for saving
  const prepareProjectData = useCallback((): string => {
    // Only include cloud assets in saved data
    const assets = project.items
      .filter(item => item.cloudAsset)
      .map(item => item.cloudAsset!);

    const data: ProjectJsonData = {
      version: 2,
      assets,
      layout: {},
    };

    return JSON.stringify(data);
  }, [project.items]);

  // Save project to backend
  const handleSaveProject = async (existingId: string | null): Promise<{ id: string } | null> => {
    const data = prepareProjectData();
    const title = projectTitle || 'Untitled Project';

    if (existingId) {
      const result = await api.updateProject(existingId, title, data);
      if (result.error) {
        console.error('Failed to update project:', result.error);
        return null;
      }
      return { id: existingId };
    } else {
      const result = await api.createProject(title, data);
      if (result.error) {
        console.error('Failed to create project:', result.error);
        return null;
      }
      if (result.data) {
        setCurrentProjectId(result.data.id);
        // Update URL with project ID for sharing
        setSearchParams({ project: result.data.id });
        return result.data;
      }
      return null;
    }
  };

  // Load project from backend (including shared projects)
  const handleLoadProject = async (projectId: string) => {
    const result = await api.getProject(projectId);

    if (result.error) {
      console.error('Failed to load project:', result.error);
      alert('Failed to load project. It may not exist or the backend is unavailable.');
      return;
    }

    if (result.data) {
      setCurrentProjectId(result.data.id);
      setProjectTitle(result.data.title);
      setSearchParams({ project: result.data.id });

      // Parse stored data
      try {
        const parsed = JSON.parse(result.data.data) as ProjectJsonData;

        // Convert cloud assets to MediaItems
        const items: MediaItem[] = (parsed.assets || []).map((asset: CloudAsset) => ({
          id: asset.assetId,
          type: 'image' as const,
          url: getAssetUrl(projectId, asset.assetId, 'original'),
          thumbUrl: getAssetUrl(projectId, asset.assetId, 'thumb'),
          title: asset.fileName,
          tags: [],
          notes: '',
          createdAt: new Date(asset.createdAt).getTime(),
          cloudAsset: asset,
          uploadStatus: 'uploaded' as const,
        }));

        setProject({
          id: project.id,
          name: result.data.title,
          items,
          createdAt: project.createdAt,
          updatedAt: Date.now(),
        });

      } catch (e) {
        console.error('Failed to parse project data:', e);
      }
    }
  };

  // Delete asset handler
  const handleRemoveItem = async (itemId: string) => {
    const item = project.items.find(i => i.id === itemId);

    if (item?.cloudAsset && currentProjectId) {
      // Delete from R2
      const result = await api.deleteAsset(currentProjectId, item.cloudAsset.assetId);
      if (result.error) {
        console.error('Failed to delete asset from cloud:', result.error);
        // Continue with local removal anyway
      }
    }

    removeItem(itemId);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Gallery</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-slate-500 font-medium px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                {project.items.length} item{project.items.length !== 1 ? 's' : ''}
                {pendingUploads.length > 0 && (
                  <span className="text-orange-500 ml-1">({pendingUploads.length} pending)</span>
                )}
              </span>

              {/* Upload Button */}
              {pendingUploads.length > 0 && (
                <Button
                  onClick={handleUploadImages}
                  disabled={isUploading}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload ({pendingUploads.length})
                </Button>
              )}

              <ShareButton projectId={currentProjectId} projectTitle={projectTitle} />

              <ProjectsPanel
                currentProjectId={currentProjectId}
                currentProjectTitle={projectTitle}
                onSave={handleSaveProject}
                onLoad={handleLoadProject}
                onTitleChange={setProjectTitle}
              />

              <Button onClick={handleNewProject} variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-4">
            The Studio
            {currentProjectId && (
              <span className="text-sm px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full border border-purple-200 dark:border-purple-800 font-medium tracking-wide">
                Multiplayer
              </span>
            )}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Where the magic (and errors) happen. {currentProjectId ? 'Changes are synced to the cloud when you save.' : 'Everything is local until you save.'}
          </p>
        </div>

        <section>
          <DropZone onFilesAdded={handleFilesAdded} />
        </section>

        {project.items.length > 0 && (
          <>
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-8 bg-purple-600 rounded-full inline-block"></span>
                  Your Assets
                </h2>
                {project.items.some(i => i.cloudAsset) && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <Cloud className="w-4 h-4" />
                    {project.items.filter(i => i.cloudAsset).length} in cloud
                  </div>
                )}
              </div>
              <MediaGrid
                items={project.items}
                onItemClick={setSelectedItem}
                onItemRemove={handleRemoveItem}
              />
            </section>

            <motion.section
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="pt-8"
            >
              <CollageCreator items={project.items} />
            </motion.section>
          </>
        )}
      </main>

      {selectedItem && (
        <MediaDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={handleItemUpdate}
        />
      )}

      {/* Upload Progress */}
      <UploadProgressPanel
        isUploading={isUploading}
        completed={uploadCompleted}
        total={uploadTotal}
        current={uploadCurrent}
        errors={uploadErrors}
        onClose={() => {
          setUploadCompleted(0);
          setUploadTotal(0);
          setUploadErrors([]);
        }}
      />
    </div>
  );
};
