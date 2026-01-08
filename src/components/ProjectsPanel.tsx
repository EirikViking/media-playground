import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Trash2, RefreshCw, Cloud, X, ChevronRight, HardDrive } from 'lucide-react';
import { Button } from './Button';
import { api, ProjectSummary } from '../utils/api';

interface ProjectsPanelProps {
    currentProjectId: string | null;
    currentProjectTitle: string;
    onSave: (projectId: string | null) => Promise<{ id: string } | null>;
    onLoad: (projectId: string) => void;
    onTitleChange: (title: string) => void;
}

export const ProjectsPanel = ({
    currentProjectId,
    currentProjectTitle,
    onSave,
    onLoad,
    onTitleChange,
}: ProjectsPanelProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null); // null = checking

    // Load projects list
    const loadProjects = async () => {
        setLoading(true);
        setError(null);

        const result = await api.listProjects();

        if (result.error) {
            setError(result.error);
            setBackendAvailable(false);
        } else if (result.data) {
            setProjects(result.data);
            setBackendAvailable(true);
        }

        setLoading(false);
    };

    // Check backend on mount
    useEffect(() => {
        api.healthCheck().then((available) => {
            console.log('[ProjectsPanel] Backend health check:', available ? 'OK' : 'UNAVAILABLE');
            setBackendAvailable(available);
        });
    }, []);

    // Load projects when panel opens
    useEffect(() => {
        if (isOpen) {
            loadProjects();
        }
    }, [isOpen]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        const result = await onSave(currentProjectId);

        if (result) {
            if (backendAvailable) {
                setSuccessMessage('Saved to cloud!');
            } else {
                setSuccessMessage('Saved locally (cloud unavailable)');
            }
            await loadProjects();
        } else {
            setError('Failed to save project');
        }

        setSaving(false);

        // Clear success message after 3 seconds
        if (result) {
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this project?')) return;

        const result = await api.deleteProject(id);

        if (result.error) {
            setError(result.error);
        } else {
            await loadProjects();
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            {/* Toggle Button */}
            <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2"
            >
                <FolderOpen className="w-4 h-4" />
                Projects
                {backendAvailable === null ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
                ) : backendAvailable ? (
                    <Cloud className="w-3 h-3 text-green-500" />
                ) : (
                    <HardDrive className="w-3 h-3 text-orange-500" />
                )}
            </Button>

            {/* Slide-out Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        <FolderOpen className="w-5 h-5 text-purple-500" />
                                        Projects
                                    </h2>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                        aria-label="Close projects panel"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Current Project Title */}
                                <div className="mb-3">
                                    <label className="text-xs text-slate-500 block mb-1">Project Name</label>
                                    <input
                                        type="text"
                                        value={currentProjectTitle}
                                        onChange={(e) => onTitleChange(e.target.value)}
                                        placeholder="Untitled Project"
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none"
                                    />
                                </div>

                                {/* Save Button - always enabled */}
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full"
                                    size="sm"
                                >
                                    {saving ? (
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    ) : backendAvailable ? (
                                        <Cloud className="w-4 h-4 mr-2" />
                                    ) : (
                                        <HardDrive className="w-4 h-4 mr-2" />
                                    )}
                                    {currentProjectId ? 'Update Project' : 'Save Project'}
                                </Button>
                            </div>

                            {/* Success Message */}
                            {successMessage && (
                                <div className="mx-4 mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg flex items-center gap-2">
                                    {backendAvailable ? <Cloud className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
                                    {successMessage}
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                                    {error}
                                </div>
                            )}

                            {/* Backend Status Info */}
                            {backendAvailable === false && (
                                <div className="mx-4 mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm rounded-lg flex items-start gap-2">
                                    <HardDrive className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Cloud unavailable. Saving locally.</span>
                                </div>
                            )}

                            {/* Projects List */}
                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-slate-500">Saved Projects</h3>
                                    <button
                                        onClick={loadProjects}
                                        disabled={loading}
                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading...
                                    </div>
                                ) : projects.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>No saved projects yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {projects.map((project) => (
                                            <div
                                                key={project.id}
                                                className={`group p-3 rounded-lg border transition-colors cursor-pointer ${project.id === currentProjectId
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                                                    }`}
                                                onClick={() => onLoad(project.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">{project.title}</p>
                                                        <p className="text-xs text-slate-500">{formatDate(project.updated_at)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(project.id);
                                                            }}
                                                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
