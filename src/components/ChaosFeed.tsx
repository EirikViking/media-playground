import { useState, useEffect } from 'react';
import { api, API_BASE } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Play, Trash2 } from 'lucide-react';
import { CloudAsset, ProjectJsonData } from '../types';
import { MashPlayer } from './MashPlayer';
import { AdminPasswordModal } from './AdminPasswordModal';

interface ChaosItem {
    id: string;
    project_id: string;
    title: string;
    created_at: string;
    output_key: string;
    output_type: string;
    output_size: number;
}

export const ChaosFeed = ({ refreshTrigger }: { refreshTrigger?: number }) => {
    const [chaosItems, setChaosItems] = useState<ChaosItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Player State
    const [selectedProjectAssets, setSelectedProjectAssets] = useState<CloudAsset[] | null>(null);
    const [playingProjectId, setPlayingProjectId] = useState<string | null>(null);
    const [loadingProject, setLoadingProject] = useState(false);

    // Delete State
    const [deleteCandidate, setDeleteCandidate] = useState<ChaosItem | null>(null);
    const [adminPasswordOpen, setAdminPasswordOpen] = useState(false);

    const loadFeed = async () => {
        setLoading(true);
        const res = await api.listChaos(50); // Fetch up to 50 items

        if (res.data) {
            setChaosItems(res.data);
        } else {
            console.error("Failed to list chaos:", res.error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadFeed();
    }, [refreshTrigger]);

    const handleCardClick = async (item: ChaosItem) => {
        setLoadingProject(true);
        try {
            // Fetch the original project to get all assets for the Mash
            const res = await api.getProject(item.project_id);
            if (res.data) {
                const json = JSON.parse(res.data.data) as ProjectJsonData;
                const assets = json.assets || [];
                if (assets.length > 0) {
                    setSelectedProjectAssets(assets);
                    setPlayingProjectId(item.project_id);
                } else {
                    alert("This project has no assets? Spooky.");
                }
            } else {
                alert("Could not load original project data. It might have been deleted.");
            }
        } catch (e) {
            console.error("Failed to load project", e);
            alert("Failed to load project details.");
        } finally {
            setLoadingProject(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, item: ChaosItem) => {
        e.stopPropagation();
        setDeleteCandidate(item);
        setAdminPasswordOpen(true);
    };

    const handleConfirmDelete = async (password: string) => {
        if (!deleteCandidate) return;

        try {
            const res = await fetch(`${API_BASE}/api/admin/db/chaos/${deleteCandidate.id}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-password': password
                }
            });

            if (res.ok) {
                setChaosItems(prev => prev.filter(p => p.id !== deleteCandidate.id));
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
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button className="px-3 py-1 text-sm rounded-md font-medium transition-colors bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-300">
                        Community Feed
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
            ) : chaosItems.length === 0 ? (
                <div className="text-center p-12 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500 font-medium">No community chaos yet.</p>
                    <p className="text-slate-400 text-sm mt-1">Be the first to publish!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {chaosItems.map((item) => {
                        // The thumbnail is the Chaos Output itself
                        const thumbUrl = `${API_BASE}/api/chaos/${item.id}/content`;

                        return (
                            <motion.div
                                key={item.id}
                                layoutId={`chaos-${item.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -5 }}
                                className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all border border-slate-200 dark:border-slate-800 cursor-pointer"
                                onClick={() => handleCardClick(item)}
                                data-testid={`chaos-card-${item.id}`}
                            >
                                {/* Thumbnail */}
                                <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                                    <img
                                        src={thumbUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        loading="lazy"
                                    />

                                    {/* Play Overlay */}
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                            {loadingProject && playingProjectId === item.project_id ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                <Play className="w-6 h-6 ml-1" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-bold text-slate-900 dark:text-white truncate pr-6">{item.title}</h3>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                    </p>
                                </div>

                                {/* Delete Button (Visible on Hover) */}
                                <button
                                    onClick={(e) => handleDeleteClick(e, item)}
                                    className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    title="Delete Chaos"
                                    data-testid="delete-chaos-btn"
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
                {selectedProjectAssets && playingProjectId && (
                    <MashPlayer
                        projectId={playingProjectId}
                        assets={selectedProjectAssets}
                        onClose={() => {
                            setSelectedProjectAssets(null);
                            setPlayingProjectId(null);
                        }}
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
