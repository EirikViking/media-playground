import { useState, useEffect } from 'react';
import { api, ProjectSummary } from '../utils/api';
import { Loader2, Folder, Clock, Users } from 'lucide-react';

interface ProjectsGalleryProps {
    onSelect: (id: string) => void;
    currentProjectId: string | null;
}

export const ProjectsGallery = ({ onSelect, currentProjectId }: ProjectsGalleryProps) => {
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);

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
                        <button
                            key={p.id}
                            onClick={() => onSelect(p.id)}
                            className={`w-full text-left p-3 rounded-xl border transition-all ${currentProjectId === p.id
                                    ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${currentProjectId === p.id ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                    <Folder className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className={`font-medium text-sm ${currentProjectId === p.id ? 'text-purple-700 dark:text-purple-300' : 'text-slate-900 dark:text-slate-200'}`}>
                                        {p.title || 'Untitled'}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                        <Clock className="w-3 h-3" />
                                        {new Date(p.updated_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};
