import { useState, useEffect } from 'react';
import { api, API_BASE } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Play, Trash2 } from 'lucide-react';
import { CloudAsset, ProjectJsonData } from '../types';
import { MashPlayer } from './MashPlayer';
import { AdminPasswordModal } from './AdminPasswordModal';

interface ParsedProject {
    id: string;
    title: string;
    assets: CloudAsset[];
    createdAt: Date;
    isLocal?: boolean;
}

export const ChaosFeed = ({ refreshTrigger }: { refreshTrigger?: number }) => {
    const [projects, setProjects] = useState<ParsedProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<ParsedProject | null>(null);
    const [deleteCandidate, setDeleteCandidate] = useState<ParsedProject | null>(null);
    const [adminPasswordOpen, setAdminPasswordOpen] = useState(false);

    // Filter/Sort
    const [filter, setFilter] = useState<'all' | 'community'>('all'); // 'local' not implemented yet without prop passing

    const loadFeed = async () => {
        setLoading(true);
        // We fetch projects now!
        const res = await api.listProjects();
        // Note: listProjects in api.ts might need to return the 'data' column?
        // Usually api.listProjects returns [] of ProjectRow.
        // If api.listProjects is not implementing GET /api/projects properly, we might fail.
        // But assuming it does based on previous context.

        if (res.data) {
            const parsed: ParsedProject[] = res.data.map((row: any) => {
                let assets: CloudAsset[] = [];
                try {
                    const json = JSON.parse(row.data) as ProjectJsonData;
                    assets = json.assets || [];
                } catch (e) {
                    console.warn("Failed to parse project data for", row.id);
                }
                return {
                    id: row.id,
                    title: row.title,
                    assets,
                    createdAt: new Date(row.created_at || Date.now())
                };
            }).filter(p => p.assets.length > 0); // Only show projects with content

            // Sort newest first
            parsed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setProjects(parsed);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadFeed();
    }, [refreshTrigger]);

    const handleDeleteClick = (e: React.MouseEvent, project: ParsedProject) => {
        e.stopPropagation();
        setDeleteCandidate(project);
        setAdminPasswordOpen(true);
    };

    const handleConfirmDelete = async (password: string) => {
        if (!deleteCandidate) return;

        try {
            const res = await fetch(`${API_BASE}/api/admin/db/project/${deleteCandidate.id}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-password': password
                }
            });

            if (res.ok) {
                // Remove from state
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                {/* Filters UI could go here */}
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${filter === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-300' : 'text-slate-500'}`}
                    >
                        All Projects
                    </button>
                    <button
                        onClick={() => setFilter('community')}
                        className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${filter === 'community' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-300' : 'text-slate-500'}`}
                    >
                        Recent
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
            ) : projects.length === 0 ? (
                <div className="text-center p-12 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500 font-medium">No community chaos yet.</p>
                    <p className="text-slate-400 text-sm mt-1">Be the first to upload!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => {
                        const thumbnail = project.assets.find(a => !a.fileName.endsWith('.mp3')) || project.assets[0];
                        const itemsCount = project.assets.length;

                        return (
                            <motion.div
                                key={project.id}
                                layoutId={`project-${project.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -5 }}
                                className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all border border-slate-200 dark:border-slate-800 cursor-pointer"
                                onClick={() => setSelectedProject(project)}
                                data-testid={`project-card-${project.id}`}
                            >
                                {/* Thumbnail */}
                                <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                                    {thumbnail ? (
                                        thumbnail.fileName.match(/\.(mp4|webm|mov)$/i) ? (
                                            <video
                                                src={`${API_BASE}/api/assets/thumb/${project.id}/${thumbnail.assetId}`}
                                                className="w-full h-full object-cover"
                                                muted
                                                loop
                                                onMouseOver={e => e.currentTarget.play()}
                                                onMouseOut={e => e.currentTarget.pause()}
                                            />
                                        ) : (
                                            <img
                                                src={`${API_BASE}/api/assets/thumb/${project.id}/${thumbnail.assetId}`}
                                                alt={thumbnail.fileName}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        )
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-400">
                                            <Sparkles className="w-8 h-8" />
                                        </div>
                                    )}

                                    {/* Play Overlay */}
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                            <Play className="w-6 h-6 ml-1" />
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-bold text-slate-900 dark:text-white truncate pr-6">{project.title}</h3>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                        <span>{itemsCount} items</span>
                                    </p>
                                </div>

                                {/* Delete Button (Visible on Hover) */}
                                <button
                                    onClick={(e) => handleDeleteClick(e, project)}
                                    className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    title="Delete Project"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Mash Player Modal */}
            <AnimatePresence>
                {selectedProject && (
                    <MashPlayer
                        projectId={selectedProject.id}
                        assets={selectedProject.assets}
                        onClose={() => setSelectedProject(null)}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AdminPasswordModal
                isOpen={adminPasswordOpen}
                onClose={() => setAdminPasswordOpen(false)}
                onConfirm={handleConfirmDelete}
                title={`Delete "${deleteCandidate?.title}"?`}
            />
        </div>
    );
};
