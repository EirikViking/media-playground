import { useState, useEffect } from 'react';
import { api, ProjectSummary, API_BASE } from '../utils/api';
import { Loader2, Folder, Clock, Users, Trash2 } from 'lucide-react';
import { AdminPasswordModal } from './AdminPasswordModal';

interface ProjectsGalleryProps {
    onSelect: (id: string) => void;
    currentProjectId: string | null;
}

export const ProjectsGallery = ({ onSelect, currentProjectId }: ProjectsGalleryProps) => {
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);

    // Delete state
    const [deleteCandidate, setDeleteCandidate] = useState<ProjectSummary | null>(null);
    const [adminPasswordOpen, setAdminPasswordOpen] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        const res = await api.listProjects(20);
        if (res.data) {
            setProjects(res.data);
        }
        setLoading(false);
    };

    const handleDeleteClick = (e: React.MouseEvent, p: ProjectSummary) => {
        e.stopPropagation();
        setDeleteCandidate(p);
        setAdminPasswordOpen(true);
    };

    const handleConfirmDelete = async (password: string) => {
        if (!deleteCandidate) return;

        try {
            // Use Admin endpoint for project deletion to ensure password check
            const res = await fetch(`${API_BASE}/api/admin/db/project/${deleteCandidate.id}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-password': password
                }
            });

            if (res.ok) {
                setProjects(prev => prev.filter(p => p.id !== deleteCandidate.id));
                setDeleteCandidate(null);
                setAdminPasswordOpen(false);
            } else {
                alert("Delete failed. Incorrect password?");
            }
        } catch (e) {
            console.error("Delete error", e);
            alert("Delete failed due to network error.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-display flex items-center gap-2 text-slate-900 dark:text-white">
                    <Users className="w-5 h-5 text-blue-500" />
                    Community Projects
                </h3>
                <button onClick={() => loadProjects()} className="text-xs text-slate-500 hover:text-purple-500">
                    Refresh
                </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {projects.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No public projects yet.</p>
                ) : (
                    projects.map((p) => (
                        <div
                            key={p.id}
                            onClick={() => onSelect(p.id)}
                            className={`group w-full text-left p-3 rounded-xl border transition-all cursor-pointer relative ${currentProjectId === p.id
                                ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${currentProjectId === p.id ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                    <Folder className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium text-sm truncate ${currentProjectId === p.id ? 'text-purple-700 dark:text-purple-300' : 'text-slate-900 dark:text-slate-200'}`}>
                                        {p.title || 'Untitled'}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                        <Clock className="w-3 h-3" />
                                        {new Date(p.updated_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteClick(e, p)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                                    title="Admin Delete"
                                    data-testid={`delete-project-${p.id}`}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AdminPasswordModal
                isOpen={adminPasswordOpen}
                onClose={() => setAdminPasswordOpen(false)}
                onConfirm={handleConfirmDelete}
                title={`Delete "${deleteCandidate?.title || 'Unknown'}"?`}
            />
        </div>
    );
};
