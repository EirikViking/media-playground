import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MediaItem, CloudAsset, ProjectJsonData, UPLOAD_LIMITS } from '../types';
import { useProject } from '../hooks/useProject';
import { ThemeToggle } from '../components/ThemeToggle';
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

import { ArrowLeft, Trash2, Upload, Shield, Layout, Settings } from 'lucide-react';
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

      // Clear local project state to match fresh start
      createNewProject();
      setProject(p => ({ ...p, name }));

      setIsCreateModalOpen(false);

      // Process pending files if any
      if (pendingFiles.length > 0) {
        processFiles(pendingFiles);
        setPendingFiles([]);
      }
    } else {
      alert('Failed to create project: ' + res.error);
    }
  };

  const handleChaosPublish = async (blob: Blob) => {
    if (!currentProjectId) return;
    await api.publishChaos(currentProjectId, `${projectTitle} Chaos`, blob);
    setChaosRefreshTrigger(prev => prev + 1);
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
    if (!currentProjectId) return; // Should be handled by modal enforcement

    const filesToUpload = pendingUploads
      .filter(item => item.file)
      .map(item => ({ id: item.id, file: item.file! }));

    if (filesToUpload.length === 0) return;

    // Check limit
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

    result.successful.forEach(asset => {
      const item = project.items.find(i => i.file?.name === asset.fileName);
      if (item) {
        updateItem(item.id, {
          cloudAsset: asset,
          uploadStatus: 'uploaded',
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

    // Auto-save project after upload
    handleSaveProject();
  };

  const handleSaveProject = async () => {
    if (!currentProjectId) return;

    const assets = project.items
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
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Hub</span>
              </Link>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
              <h1 className="font-display font-bold text-xl text-slate-900 dark:text-white">The Studio</h1>
            </div>
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

              <ThemeToggle />
              <Link to="/admin">
                <Button variant="ghost" size="sm" title="Admin">
                  <Shield className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-8">

          {/* Main Content Area */}
          <div className="space-y-8 min-w-0">

            {/* DropZone / Welcome */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-1 shadow-sm border border-slate-200 dark:border-slate-800">
              <DropZone onFilesAdded={handleFilesAdded} />
            </div>

            {/* Media Grid */}
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

            {/* Chaos Creator */}
            {project.items.length > 0 && (
              <CollageCreator items={project.items} onPublish={handleChaosPublish} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 xl:sticky xl:top-24 h-fit">

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

            {/* Projects Gallery */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <ProjectsGallery onSelect={handleLoadProject} currentProjectId={currentProjectId} />
            </div>

            {/* Chaos Feed */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <ChaosFeed refreshTrigger={chaosRefreshTrigger} />
            </div>

          </div>
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
