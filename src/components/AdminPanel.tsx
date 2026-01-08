import React, { useState, useEffect } from 'react';
import { X, Trash2, Shield, Lock, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminPanel = ({ isOpen, onClose }: AdminPanelProps) => {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState<'summary' | 'projects' | 'media'>('summary');
    const [summary, setSummary] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [media, setMedia] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Auth check wrapper
    const authenticatedFetch = async (path: string, options: RequestInit = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            'x-admin-password': password,
            ...options.headers,
        };
        const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
        if (res.status === 401) {
            setIsAuthenticated(false);
            setError('Invalid password');
            throw new Error('Unauthorized');
        }
        return res;
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'summary') {
                const res = await authenticatedFetch('/api/admin/db/summary');
                if (res.ok) setSummary(await res.json());
            } else if (activeTab === 'projects') {
                const res = await authenticatedFetch('/api/admin/db/projects');
                if (res.ok) setProjects(await res.json());
            } else if (activeTab === 'media') {
                const res = await authenticatedFetch('/api/admin/db/media');
                if (res.ok) setMedia(await res.json());
            }
        } catch (e) {
            // Error handled in fetch
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && isOpen) {
            loadData();
        }
    }, [isAuthenticated, isOpen, activeTab]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Optimistically set auth, real check happens on fetch
        setIsAuthenticated(true);
    };

    const handleDelete = async (endpoint: string, confirmMsg: string) => {
        if (!confirm(confirmMsg)) return;
        setLoading(true);
        try {
            const res = await authenticatedFetch(endpoint, { method: 'DELETE' });
            if (res.ok) {
                alert('Deleted successfully');
                loadData();
            } else {
                alert('Delete failed');
            }
        } catch (e) {
            alert('Error deleting');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-500" />
                        Admin Console
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    {!isAuthenticated ? (
                        <form onSubmit={handleLogin} className="max-w-xs mx-auto mt-10">
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Admin Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                                        placeholder="Enter password"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full">Unlock</Button>
                            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
                                <button
                                    onClick={() => setActiveTab('summary')}
                                    className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === 'summary' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Summary
                                </button>
                                <button
                                    onClick={() => setActiveTab('projects')}
                                    className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === 'projects' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Projects
                                </button>
                                <button
                                    onClick={() => setActiveTab('media')}
                                    className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === 'media' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Media Assets
                                </button>
                            </div>

                            {/* Content Area */}
                            {loading ? (
                                <div className="text-center py-10 text-slate-500">Loading...</div>
                            ) : (
                                <>
                                    {activeTab === 'summary' && summary && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50">
                                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.projects}</div>
                                                <div className="text-sm text-slate-500">Total Projects</div>
                                            </div>
                                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/50">
                                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.assets}</div>
                                                <div className="text-sm text-slate-500">Total Assets</div>
                                            </div>
                                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900/50">
                                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.totalSizeMB} MB</div>
                                                <div className="text-sm text-slate-500">Total Storage</div>
                                            </div>

                                            <div className="md:col-span-3 mt-8 p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-xl">
                                                <h3 className="text-red-600 font-bold flex items-center gap-2 mb-2">
                                                    <AlertTriangle className="w-5 h-5" />
                                                    Danger Zone
                                                </h3>
                                                <p className="text-sm text-slate-600 mb-4">
                                                    This will wipe ALL projects and media from the database and R2 buckets. This cannot be undone.
                                                </p>
                                                <Button
                                                    onClick={() => handleDelete('/api/admin/db/reset', 'ARE YOU SURE? This will wipe EVERYTHING!')}
                                                    className="bg-red-600 hover:bg-red-700 text-white"
                                                >
                                                    Reset Database
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'projects' && (
                                        <div className="space-y-2">
                                            {projects.map((p: any) => (
                                                <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                    <div>
                                                        <div className="font-medium">{p.title || 'Untitled'}</div>
                                                        <div className="text-xs text-slate-500">{new Date(p.updated_at).toLocaleString()} • {Math.round(p.dataSize / 1024)} KB JSON</div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
                                                        onClick={() => handleDelete(`/api/admin/db/project/${p.id}`, `Delete project "${p.title}"?`)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {projects.length === 0 && <p className="text-center text-slate-500">No projects found.</p>}
                                        </div>
                                    )}

                                    {activeTab === 'media' && (
                                        <div className="space-y-2">
                                            {media.map((m: any) => (
                                                <div key={m.assetId} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden">
                                                            <img
                                                                src={`${API_BASE}/api/assets/thumb/${m.projectId}/${m.assetId}`}
                                                                className="w-full h-full object-cover"
                                                                alt=""
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium truncate max-w-[200px]">{m.fileName}</div>
                                                            <div className="text-xs text-slate-500">
                                                                {Math.round(m.byteSize / 1024)} KB • {m.projectTitle}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
                                                        onClick={() => handleDelete(`/api/admin/db/media/${m.assetId}`, `Delete asset "${m.fileName}"?`)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {media.length === 0 && <p className="text-center text-slate-500">No media assets found.</p>}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
