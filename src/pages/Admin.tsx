import React, { useState, useEffect } from 'react';
import { Shield, Lock, Trash2, AlertTriangle, ArrowLeft, Database, HardDrive, FileImage, Link as LinkIcon, Check, Edit2, X, Save, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { API_BASE } from '../utils/api';

export const Admin = () => {
    const [password, setPassword] = useState('');
    // Initialize auth state from storage to avoid flash of login content
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return !!(sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token'));
    });
    const [activeTab, setActiveTab] = useState<'summary' | 'projects' | 'media' | 'community'>('summary');
    const [summary, setSummary] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [media, setMedia] = useState<any[]>([]);
    const [chaosItems, setChaosItems] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);

    // Editing state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    const getAuthHeaders = () => {
        const token = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['x-admin-token'] = token;
        } else if (password) {
            headers['x-admin-password'] = password;
        }
        return headers;
    };

    const authenticatedFetch = async (path: string, options: RequestInit = {}) => {
        const headers = {
            ...getAuthHeaders(),
            ...options.headers,
        };
        const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
        if (res.status === 401) {
            setIsAuthenticated(false);
            setError('Session expired or invalid credentials');
            sessionStorage.removeItem('admin_token');
            localStorage.removeItem('admin_token');
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
            } else if (activeTab === 'community') {
                const res = await authenticatedFetch('/api/chaos?limit=100'); // Re-using public endpoint, but admin might need a specific one if public is filtered?
                // Actually, let's use the public one for now, or assume admin access makes it check headers?
                // The public endpoint /api/chaos returns list.
                // But wait, the public endpoint doesn't require auth.
                // However, we can use it to LIST items.
                // If we need an admin-specific list (e.g. including hidden items), we'd need a new endpoint.
                // For now, public list is fine.
                if (res.ok) setChaosItems(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated, activeTab]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Attempt generic login first to get token
            const res = await fetch(`${API_BASE}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.token) {
                    if (rememberMe) {
                        localStorage.setItem('admin_token', data.token);
                    } else {
                        sessionStorage.setItem('admin_token', data.token);
                    }
                    setIsAuthenticated(true);
                    setPassword(''); // Clear from memory
                }
            } else {
                // Fallback for legacy backend or wrong password
                if (res.status === 401) setError('Wrong password');
                else setError('Login failed');
            }
        } catch (e) {
            setError('Connection failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('admin_token');
        localStorage.removeItem('admin_token');
        setPassword('');
        setActiveTab('summary');
    };

    const handleDelete = async (endpoint: string, confirmMsg?: string, requireInput?: string) => {
        if (requireInput) {
            const input = prompt(confirmMsg || `Type "${requireInput}" to confirm:`);
            if (input !== requireInput) return;
        } else if (confirmMsg) {
            if (!confirm(confirmMsg)) return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await authenticatedFetch(endpoint, { method: 'DELETE' });
            if (res.ok) {
                loadData();
            } else {
                const text = await res.text();
                setError(`Delete failed: ${text}`);
            }
        } catch (e) {
            setError('Error deleting item');
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (id: string, currentTitle: string) => {
        setEditingId(id);
        setEditTitle(currentTitle);
    };

    const saveRename = async (endpointPattern: string) => {
        if (!editingId) return;
        setLoading(true);
        try {
            const endpoint = endpointPattern.replace(':id', editingId);
            const res = await authenticatedFetch(endpoint, {
                method: 'PUT',
                body: JSON.stringify({ title: editTitle })
            });
            if (res.ok) {
                setEditingId(null);
                loadData();
            } else {
                setError('Rename failed');
            }
        } catch (e) {
            setError('Rename failed');
        } finally {
            setLoading(false);
        }
    };

    const copyLinkToClipboard = async (projectId: string, assetId: string) => {
        const url = `${API_BASE}/api/assets/original/${projectId}/${assetId}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedAssetId(assetId);
            setTimeout(() => setCopiedAssetId(null), 2000);
        } catch (e) {
            alert(`Failed to copy link. URL: ${url}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white pb-20">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-slate-500 hover:text-purple-500 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Shield className="w-6 h-6 text-purple-500" />
                            Admin Console
                        </h1>
                    </div>
                    {isAuthenticated && (
                        <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-2">
                            <LogOut className="w-4 h-4" />
                            Log Out
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6">
                {!isAuthenticated ? (
                    <div className="max-w-md mx-auto mt-20 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Restricted Access</h2>
                            <p className="text-slate-500">Please enter the admin password to continue.</p>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Password</label>
                                <input
                                    data-testid="admin-password-input"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="••••••••"
                                    autoFocus
                                />
                            </div>
                            <div className="flex items-center gap-2 mb-6">
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={e => setRememberMe(e.target.checked)}
                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                />
                                <label htmlFor="rememberMe" className="text-sm text-slate-600 dark:text-slate-400 select-none cursor-pointer">
                                    Remember me on this device
                                </label>
                            </div>
                            <Button type="submit" className="w-full py-3" data-testid="admin-unlock-button" disabled={loading}>
                                {loading ? 'Checking...' : 'Unlock Dashboard'}
                            </Button>
                            {error && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
                                    {error}
                                </div>
                            )}
                        </form>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Navigation Tabs */}
                        <div className="flex gap-2 p-1 bg-white dark:bg-slate-800 rounded-xl inline-block shadow-sm overflow-x-auto">
                            {['summary', 'projects', 'media', 'community'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                {error}
                            </div>
                        )}

                        {loading && <div className="text-center py-4 text-slate-500">Loading...</div>}

                        {/* Content */}
                        {!loading && activeTab === 'summary' && summary && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="admin-summary">
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                            <Database className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-500">Total Projects</div>
                                            <div className="text-2xl font-bold">{summary.projects}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                                            <FileImage className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-500">Media Assets</div>
                                            <div className="text-2xl font-bold">{summary.assets}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                                            <HardDrive className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-500">Storage Used</div>
                                            <div className="text-2xl font-bold">{summary.totalSizeMB} MB</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 p-6 rounded-2xl">
                                    <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        Danger Zone
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                                        This will permanently delete all projects and media files from the database and storage buckets. This action cannot be undone.
                                    </p>
                                    <Button
                                        data-testid="admin-reset-button"
                                        onClick={() => handleDelete('/api/admin/db/reset', 'Start full reset sequence. All data will be lost.', 'RESET')}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        Wipe Database & Storage
                                    </Button>
                                </div>
                            </div>
                        )}

                        {!loading && activeTab === 'projects' && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                {projects.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">No projects found.</div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {projects.map((p: any) => (
                                            <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors" data-testid="admin-project-row">
                                                <div className="flex-1 mr-4">
                                                    {editingId === p.id ? (
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={editTitle}
                                                                onChange={(e) => setEditTitle(e.target.value)}
                                                                className="flex-1 px-2 py-1 rounded border border-purple-300 dark:border-purple-700 dark:bg-slate-800"
                                                                autoFocus
                                                            />
                                                            <button onClick={() => saveRename('/api/admin/db/project/:id/rename')} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => setEditingId(null)} className="p-1 text-red-500 hover:bg-red-100 rounded">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                                {p.title || 'Untitled Project'}
                                                                <button onClick={() => startEditing(p.id, p.title)} className="text-slate-300 hover:text-purple-500 transition-colors">
                                                                    <Edit2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            <div className="text-xs text-slate-500 flex gap-2">
                                                                <span>ID: {p.id}</span>
                                                                <span>•</span>
                                                                <span>{new Date(p.updated_at).toLocaleString()}</span>
                                                                <span>•</span>
                                                                <span>{Math.round((p.dataSize || 0) / 1024)} KB</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(`/api/admin/db/project/${p.id}`, `Delete project "${p.title}"?`)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete Project"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {!loading && activeTab === 'community' && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                {chaosItems.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">No community creations found.</div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {chaosItems.map((c: any) => (
                                            <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                                                <div className="flex-1 mr-4">
                                                    {editingId === c.id ? (
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={editTitle}
                                                                onChange={(e) => setEditTitle(e.target.value)}
                                                                className="flex-1 px-2 py-1 rounded border border-purple-300 dark:border-purple-700 dark:bg-slate-800"
                                                                autoFocus
                                                            />
                                                            <button onClick={() => saveRename('/api/admin/db/chaos/:id/rename')} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => setEditingId(null)} className="p-1 text-red-500 hover:bg-red-100 rounded">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                                {c.title || 'Untitled'}
                                                                <button onClick={() => startEditing(c.id, c.title)} className="text-slate-300 hover:text-purple-500 transition-colors">
                                                                    <Edit2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            <div className="text-xs text-slate-500 flex gap-2">
                                                                <span>ID: {c.id}</span>
                                                                <span>•</span>
                                                                <span>{new Date(c.created_at).toLocaleString()}</span>
                                                                <span>•</span>
                                                                <span>{c.output_type}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <a href={`${API_BASE}/api/chaos/${c.id}/content`} target="_blank" className="p-2 text-slate-400 hover:text-blue-500">
                                                        <LinkIcon className="w-5 h-5" />
                                                    </a>
                                                    <button
                                                        onClick={() => handleDelete(`/api/admin/db/chaos/${c.id}`, `Delete chaos item "${c.title}"?`)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {!loading && activeTab === 'media' && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                {media.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">No media assets found.</div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {media.map((m: any) => (
                                            <div key={m.assetId} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors" data-testid="admin-media-row">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-600">
                                                        <img
                                                            src={`${API_BASE}/api/assets/thumb/${m.projectId}/${m.assetId}`}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{m.fileName}</div>
                                                        <div className="text-xs text-slate-500 flex flex-wrap gap-x-2">
                                                            <span>{(m.byteSize / 1024 / 1024).toFixed(2)} MB</span>
                                                            <span>•</span>
                                                            <span className="truncate max-w-[150px]">Project: {m.projectTitle}</span>
                                                            <span>•</span>
                                                            <span className="font-mono text-[10px]">{m.assetId.substring(0, 8)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => copyLinkToClipboard(m.projectId, m.assetId)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Copy Link to Asset"
                                                    >
                                                        {copiedAssetId === m.assetId ? (
                                                            <Check className="w-5 h-5 text-green-600" />
                                                        ) : (
                                                            <LinkIcon className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(`/api/admin/db/media/${m.projectId}/${m.assetId}`, `Delete asset "${m.fileName}"?`)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete Asset"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

