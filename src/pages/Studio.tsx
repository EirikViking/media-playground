import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MediaItem, CloudAsset, ProjectJsonData, UPLOAD_LIMITS } from '../types';
import { useProject } from '../hooks/useProject';
import { Button } from '../components/Button';
import { DropZone } from '../components/DropZone';
import { MediaGrid } from '../components/MediaGrid';
import { MediaDetail } from '../components/MediaDetail';
import { CollageCreator } from '../components/CollageCreator';
import { ShareButton } from '../components/ShareButton';
import { UploadProgressPanel } from '../components/UploadProgressPanel';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { ChaosFeed } from '../components/ChaosFeed';
import { ProjectsGallery } from '../components/ProjectsGallery';

import { Trash2, Upload, Layout, Settings, Globe, Info } from 'lucide-react';
import { fileToDataUrl } from '../utils/storage';
import { api } from '../utils/api';
import { uploadImages, UploadProgress, validateFile, getAssetUrl } from '../utils/upload';

export const Studio = () => {
  const { project, addItem, updateItem, removeItem, createNewProject, setProject } = useProject();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState(project.name);
  const [searchParams, setSearchParams] = useSearchParams();

  // Modal and Sidebar State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [chaosRefreshTrigger, setChaosRefreshTrigger] = useState(0);

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
      handleLoadProject(projectIdFromUrl);
    }
  }, [searchParams]);

  const handleFilesAdded = async (files: File[]) => {
    // Enforcement: Project required
    if (!currentProjectId) {
      setPendingFiles(files);
      setIsCreateModalOpen(true);
      return;
    }

    processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    // Filter supported files using strict allowed types
    const mediaFiles = files.filter(f => UPLOAD_LIMITS.allowedTypes.includes(f.type));
    const unsupportedFiles = files.filter(f => !UPLOAD_LIMITS.allowedTypes.includes(f.type));

    if (unsupportedFiles.length > 0) {
      alert(`${unsupportedFiles.length} files skipped. Only images, videos, and audio are supported.`);
    }

    // Mash Mode Rule: Only one audio file per batch
    const allAudio = mediaFiles.filter(f => f.type.startsWith('audio/'));
    if (allAudio.length > 1) {
      alert("Mash Validity Error: Only one audio track allowed per batch for background music harmony.");
      return; // REJECT batch
    }

    for (const file of mediaFiles) {
      try {
        const validation = validateFile(file);
        if (!validation.valid) {
          alert(`Whoops! ${file.name} is too big/invalid. ${validation.error}`);
          continue;
        }

        const dataUrl = await fileToDataUrl(file);

        let type: MediaItem['type'] = 'image';
        if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';

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

  const handleProjectCreated = async (name: string) => {
    const res = await api.createProject(name);
    if (res.data) {
      setCurrentProjectId(res.data.id);
      setProjectTitle(name);
      setSearchParams({ project: res.data.id });

      createNewProject();
      setProject(p => ({ ...p, name }));

      setIsCreateModalOpen(false);

      if (pendingFiles.length > 0) {
        processFiles(pendingFiles);
        setPendingFiles([]);
      }
    } else {
      alert('Failed to create project: ' + res.error);
    }
  };

  // UPDATED: Publish logic now uses api.publishChaos
  const handleChaosPublish = async (blob: Blob) => {
    if (!currentProjectId) return;

    setIsUploading(true);
    try {
      // 1. Publish to Community Feed (Chaos Table)
      const res = await api.publishChaos(currentProjectId, projectTitle, blob);

      if (res.error) {
        throw new Error(res.error);
      }

      // 2. Save Project Trigger (ensure latest state is available for viewers)
      await handleSaveProject();

      // 3. Refresh Community Feed
      setChaosRefreshTrigger(prev => prev + 1);

    } catch (e: any) {
      console.error("Publish failed", e);
      alert("Failed to publish to community: " + (e.message || "Unknown error"));
      // Re-throw to let CollageCreator know it failed
      throw e;
    } finally {
      setIsUploading(false);
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
      if (window.confirm('Start fresh? This will clear your current workspace.')) {
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

  const pendingUploads = project.items.filter(
    item => item.file && item.uploadStatus !== 'uploaded'
  );

  const handleUploadImages = async () => {
    if (!currentProjectId) return;

    const filesToUpload = pendingUploads
      .filter(item => item.file)
      .map(item => ({ id: item.id, file: item.file! }));

    if (filesToUpload.length === 0) return;

    const existingAssets = project.items.filter(i => i.cloudAsset).length;
    if (existingAssets + filesToUpload.length > UPLOAD_LIMITS.maxAssetsPerProject) {
      alert(`Maximum ${UPLOAD_LIMITS.maxAssetsPerProject} images per project.`);
      return;
    }

    setIsUploading(true);
    setUploadCompleted(0);
    setUploadTotal(filesToUpload.length);
    setUploadErrors([]);

    filesToUpload.forEach(({ id }) => {
      updateItem(id, { uploadStatus: 'uploading' });
    });

    const result = await uploadImages(
      currentProjectId,
      filesToUpload.map(f => f.file),
      (completed, total, current) => {
        setUploadCompleted(completed);
        setUploadTotal(total);
        setUploadCurrent(current);
      }
    );

    // FIX: Construct the new state manually to ensure handleSaveProject sees it
    // Updated to include proper URL hydration from stashed changes
    const updatedItems = project.items.map(item => {
      // Check success
      const successAsset = result.successful.find(asset => asset.fileName === item.file?.name);
      if (successAsset) {
        return {
          ...item,
          cloudAsset: successAsset,
          uploadStatus: 'uploaded' as const,
          // Explicitly update URLs to use cloud assets immediately after upload
          url: getAssetUrl(currentProjectId, successAsset.assetId, 'original'),
          thumbUrl: getAssetUrl(currentProjectId, successAsset.assetId, 'thumb'),
        };
      }
      // Check failure
      const failure = result.failed.find(f => f.fileName === item.file?.name);
      if (failure) {
        return { ...item, uploadStatus: 'error' as const, uploadError: failure.error };
      }
      return item;
    });

    // Update local state (visuals)
    setProject({ ...project, items: updatedItems });

    setUploadErrors(result.failed);
    setIsUploading(false);

    // Save with the *correct* updated items
    await handleSaveProject(updatedItems);
    setChaosRefreshTrigger(prev => prev + 1);
  };

  // FIX: Accept items override to handle race condition where state isn't updated yet
  const handleSaveProject = async (itemsOverride?: MediaItem[]) => {
    if (!currentProjectId) return;

    const currentItems = itemsOverride || project.items;

    // Collect all assets (uploaded)
    const assets = currentItems
      .filter(item => item.cloudAsset)
      .map(item => item.cloudAsset!);

    const data: ProjectJsonData = {
      version: 2,
      assets,
      layout: {},
    };

    await api.updateProject(currentProjectId, projectTitle, JSON.stringify(data));
  };

  const handleLoadProject = async (projectId: string) => {
    const result = await api.getProject(projectId);

    if (result.error) {
      console.error('Failed to load project:', result.error);
      return;
    }

    if (result.data) {
      setCurrentProjectId(result.data.id);
      setProjectTitle(result.data.title);
      setSearchParams({ project: result.data.id });

      try {
        const parsed = JSON.parse(result.data.data) as ProjectJsonData;

        // Convert cloud assets to MediaItems with better type detection (from stash)
        const items: MediaItem[] = (parsed.assets || []).map((asset: CloudAsset) => {
          let type: MediaItem['type'] = 'image';
          const lowerName = asset.fileName.toLowerCase();
          if (lowerName.endsWith('.mp4') || lowerName.endsWith('.mov') || lowerName.endsWith('.webm')) {
            type = 'video';
          } else if (lowerName.endsWith('.mp3') || lowerName.endsWith('.wav') || lowerName.endsWith('.ogg')) {
            type = 'audio';
          }

          return {
            id: asset.assetId,
            type,
            url: getAssetUrl(projectId, asset.assetId, 'original'),
            thumbUrl: getAssetUrl(projectId, asset.assetId, 'thumb'),
            title: asset.fileName,
            tags: [],
            notes: '',
            createdAt: new Date(asset.createdAt).getTime(),
            cloudAsset: asset,
            uploadStatus: 'uploaded' as const,
          };
        });

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

  const handleRemoveItem = async (itemId: string) => {
    const item = project.items.find(i => i.id === itemId);
    if (item?.cloudAsset && currentProjectId) {
      await api.deleteAsset(currentProjectId, item.cloudAsset.assetId);
    }
    removeItem(itemId);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              Studio Workspace
            </h1>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-slate-500 font-medium px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                {project.items.length} item{project.items.length !== 1 ? 's' : ''}
              </span>

              {pendingUploads.length > 0 && (
                <Button
                  onClick={handleUploadImages}
                  disabled={isUploading}
                  size="sm"
                  variant="primary"
                  className="flex items-center gap-2 animate-pulse"
                >
                  <Upload className="w-4 h-4" />
                  Upload ({pendingUploads.length})
                </Button>
              )}

              <ShareButton projectId={currentProjectId} projectTitle={projectTitle} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">

        {/* Explanation Block */}
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-3xl border border-purple-100 dark:border-purple-900/30" data-testid="studio-explanation">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-500" />
              Studio Guide
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-purple-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1 text-sm">Local vs Community</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Your work is <span className="font-semibold">Local</span> and private until you choose to Share or Publish.
                </p>
              </div>
              <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-purple-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1 text-sm">Upload</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Drag & Drop images, video, and audio to build your project assets.
                </p>
              </div>
              <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-purple-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1 text-sm">Share</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Click <span className="font-semibold">Share</span> to create a read-only link for friends to view your project.
                </p>
              </div>
              <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-purple-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1 text-sm">Publish</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Publish</span> posts your generated Chaos Collage to the public Community Feed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Layout: Main Feed and below it the Editor */}
        <div className="space-y-12">

          {/* 1. Community Feed (Dominant) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-6 h-6 text-purple-600" />
                Community Creations
              </h2>
            </div>
            <ChaosFeed refreshTrigger={chaosRefreshTrigger} />
          </section>

          <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />

          {/* 2. Local Workspace / Drop / Editor */}
          <section className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-8">
            <div className="space-y-8 min-w-0">

              {/* DropZone */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-500" />
                    Add Media
                  </h3>
                  <p className="text-xs text-slate-500">
                    Drop images, videos, and music here to build your Mash.
                  </p>
                </div>
                <DropZone onFilesAdded={handleFilesAdded} />
              </div>

              {/* Media Grid (Workspace) */}
              {project.items.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layout className="w-5 h-5 text-purple-500" />
                      Workspace
                    </h2>
                  </div>
                  <MediaGrid
                    items={project.items}
                    onItemClick={setSelectedItem}
                    onItemRemove={handleRemoveItem}
                  />
                </div>
              )}

              {/* Collage / Chaos Creator */}
              {project.items.length > 0 && (
                <CollageCreator items={project.items} onPublish={handleChaosPublish} />
              )}
            </div>

            {/* Right Sidebar (Project Info) */}
            <div className="space-y-6 h-fit">
              {/* Project Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Project
                  </h3>
                  {currentProjectId && (
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">
                      {currentProjectId.slice(0, 8)}
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-1">Current Name</div>
                  <div className="text-lg font-display font-medium truncate" title={projectTitle}>
                    {projectTitle}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleNewProject} variant="ghost" size="sm" className="w-full text-red-500 hover:text-red-600 border border-slate-200 dark:border-slate-700">
                    <Trash2 className="w-4 h-4 mr-2" /> Start Over
                  </Button>
                </div>
              </div>

              {/* Simplified Local Gallery in Sidebar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h4 className="font-bold mb-4 text-sm text-slate-500 uppercase">Recent Projects</h4>
                <ProjectsGallery onSelect={handleLoadProject} currentProjectId={currentProjectId} />
              </div>
            </div>
          </section>

        </div>
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

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setPendingFiles([]); }}
        onCreate={handleProjectCreated}
      />

    </div>
  );
};
