import { useState, useEffect } from 'react';
import { api, API_BASE } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X, Download } from 'lucide-react';

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
    const [items, setItems] = useState<ChaosItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<ChaosItem | null>(null);

    const loadFeed = async () => {
        const res = await api.listChaos(20);
        if (res.data) {
            setItems(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadFeed();
    }, [refreshTrigger]);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold font-display flex items-center gap-2 text-slate-900 dark:text-white">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Community Chaos
            </h3>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-500">No chaos generated yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setSelectedItem(item)}
                            className="group cursor-pointer relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
                        >
                            <img
                                src={`${API_BASE}/api/chaos/${item.id}/content`}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                                <p className="text-white text-xs font-medium truncate">{item.title}</p>
                                <p className="text-white/70 text-[10px]">{new Date(item.created_at).toLocaleDateString()}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedItem(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            layoutId={`chaos-${selectedItem.id}`}
                            className="relative max-w-4xl w-full max-h-[90vh] bg-transparent flex flex-col items-center justify-center pointer-events-none"
                        >
                            <img
                                src={`${API_BASE}/api/chaos/${selectedItem.id}/content`}
                                alt={selectedItem.title}
                                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl pointer-events-auto"
                            />
                            <div className="mt-4 flex gap-4 pointer-events-auto">
                                <a
                                    href={`${API_BASE}/api/chaos/${selectedItem.id}/content`}
                                    download={`${selectedItem.title}.png`}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-200 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Download className="w-4 h-4" /> Download
                                </a>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-colors backdrop-blur-md"
                                >
                                    <X className="w-4 h-4" /> Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
