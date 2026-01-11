import React, { useState, useEffect } from 'react';
import { Shield, Lock, Trash2, AlertTriangle, ArrowLeft, Database, HardDrive, FileImage, Link as LinkIcon, Check, Edit2, X, Save, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { API_BASE, api } from '../utils/api';
import { getAdminToken, setAdminToken, clearAdminToken, getAuthHeaders } from '../utils/adminAuth';
import { getLocalState, updateLocalState } from '../utils/localState';
import { QuotaInfo } from '../utils/api';

export const Admin = () => {
    const [password, setPassword] = useState('');
    // Initialize auth state from storage
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAdminToken());
    const [activeTab, setActiveTab] = useState<'summary' | 'projects' | 'media' | 'community' | 'assets_r2'>(() => {
        return (getLocalState().lastAdminTab as any) || 'summary';
    });
    const [summary, setSummary] = useState<any>(null);
    const [quota, setQuota] = useState<QuotaInfo | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [media, setMedia] = useState<any[]>([]);
    const [chaosItems, setChaosItems] = useState<any[]>([]);
    const [r2Assets, setR2Assets] = useState<any[]>([]);
    const [r2Cursor, setR2Cursor] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);

    // Editing state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        body: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        body: '',
        onConfirm: () => { }
    });

    const authenticatedFetch = async (path: string, options: RequestInit = {}) => {
        const headers = {
            ...getAuthHeaders(),
            ...options.headers,
        };
        const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
        if (res.status === 401) {
            setIsAuthenticated(false);
            setError('Session expired or invalid credentials');
            clearAdminToken();
            throw new Error('Unauthorized');
        }
        return res;
    };

    const loadData = async (cursor?: string) => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'summary') {
                const res = await api.getAdminSummary();
                if (res.data) setSummary(res.data);
                else if (res.error) setError(res.error);

                const qRes = await api.getAdminQuota();
                if (qRes.data) setQuota(qRes.data);
            } else if (activeTab === 'projects') {
                const res = await api.listAdminProjects();
                if (res.data) setProjects(res.data);
                else if (res.error) setError(res.error);
            } else if (activeTab === 'media') {
                const res = await api.listAdminMedia();
                if (res.data) setMedia(res.data);
                else if (res.error) setError(res.error);
            } else if (activeTab === 'community') {
                const res = await api.listChaos(1000);
                if (res.data) {
                    const items = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
                    setChaosItems(items);
                } else if (res.error) {
                    setError('Failed to load community items: ' + res.error);
                }
            } else if (activeTab === 'assets_r2') {
                const res = await api.listAdminAssets('', 500, cursor);
                if (res.data) {
                    if (cursor) {
                        setR2Assets(prev => [...prev, ...res.data!.items]);
                    } else {
                        setR2Assets(res.data.items);
                    }
                    setR2Cursor(res.data.cursor);
                } else if (res.error) {
                    setError('Failed to load R2 assets: ' + res.error);
                }
            }
        } catch (e: any) {
            console.error('Admin: Load data error', e);
            setError(e.message || 'Unknown error loading data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated, activeTab]);

    useEffect(() => {
        updateLocalState({ lastAdminTab: activeTab });
    }, [activeTab]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.token) {
                    setAdminToken(data.token, rememberMe);
                    setIsAuthenticated(true);
                    setPassword('');
                }
            } else {
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
        clearAdminToken();
        setPassword('');
        setActiveTab('summary');
    };

    const handleDelete = async (endpoint: string, itemName: string, isReset = false) => {
        const confirmAction = async () => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
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

        if (isReset) {
            const input = prompt('Start full reset sequence. All data will be lost. Type "RESET" to confirm:');
            if (input === 'RESET') {
                confirmAction();
            }
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: `Delete "${itemName}"?`,
            body: 'This action permanently deletes the item.',
            onConfirm: confirmAction
        });
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

    const copyR2LinkToClipboard = async (key: string) => {
        // Determine URL based on key pattern
        // Pattern 1: chaos/projectId/chaosId -> /api/chaos/chaosId/content
        // Pattern 2: projectId/assetId/kind -> /api/assets/kind/projectId/assetId

        let url = `${API_BASE}/${key}`; // fallback

        if (key.startsWith('chaos/')) {
            const parts = key.split('/');
            if (parts.length === 3) {
                url = `${API_BASE}/api/chaos/${parts[2]}/content`;
            }
        } else {
            const parts = key.split('/');
            if (parts.length === 3) {
                url = `${API_BASE}/api/assets/${parts[2]}/${parts[0]}/${parts[1]}`;
            }
        }

        try {
            await navigator.clipboard.writeText(url);
            setCopiedAssetId(key);
            setTimeout(() => setCopiedAssetId(null), 2000);
        } catch (e) {
            alert(`Failed to copy link. URL: ${url}`);
        }
    };

    const handleDeleteR2 = async (key: string) => {
        setConfirmModal({
            isOpen: true,
            title: `Delete R2 Object?`,
            body: `Confirm permanent deletion of "${key}" from R2 storage.`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setLoading(true);
                const res = await api.deleteAdminR2Asset(key);
                if (res.data) {
                    setR2Assets(prev => prev.filter(a => a.key !== key));
                } else {
                    setError('Delete failed: ' + res.error);
                }
                setLoading(false);
            }
        });
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
                            {['summary', 'projects', 'media', 'community', 'assets_r2'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize whitespace-nowrap ${activeTab === tab ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    {tab === 'assets_r2' ? 'All R2 Assets' : tab}
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
                                {quota && (
                                    <div className="md:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <Shield className={`w-5 h-5 ${quota.near_limit ? 'text-amber-500' : 'text-green-500'}`} />
                                            Lagringskvote (R2)
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-4 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${quota.near_limit ? 'bg-amber-500' : 'bg-green-500'}`}
                                                    style={{ width: `${Math.min(100, (quota.r2_used_bytes / quota.r2_limit_bytes) * 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-sm text-slate-500">
                                                <span>Brukt: {(quota.r2_used_bytes / 1024 / 1024).toFixed(2)} MB</span>
                                                <span>Grense: {(quota.r2_limit_bytes / 1024 / 1024).toFixed(0)} MB</span>
                                            </div>
                                            <div className={`p-4 rounded-xl text-sm ${quota.near_limit ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300' : 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'}`}>
                                                {quota.near_limit
                                                    ? "Du nærmer deg lagringsgrensen. For å unngå ekstra kostnader er opplastninger snart midlertidig satt på pause."
                                                    : "Lagringen ser bra ut."}
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                                        onClick={() => handleDelete('/api/admin/db/reset', 'Full Database Reset', true)}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        Wipe Database & Storage
                                    </Button>
                                </div>
                            </div>
                        )
                        }

                        {
                            !loading && activeTab === 'projects' && (
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
                                                        onClick={() => handleDelete(`/api/admin/db/project/${p.id}`, p.title || 'Untitled Project')}
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
                            )
                        }

                        {
                            !loading && activeTab === 'community' && (
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
                                                            onClick={() => handleDelete(`/api/admin/db/chaos/${c.id}`, c.title || 'Untitled')}
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
                            )
                        }

                        {
                            !loading && activeTab === 'media' && (
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
                                                            onClick={() => handleDelete(`/api/admin/db/media/${m.projectId}/${m.assetId}`, m.fileName)}
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
                            )
                        }

                        {
                            !loading && activeTab === 'assets_r2' && (
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        {r2Assets.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500">No objects found in R2.</div>
                                        ) : (
                                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {r2Assets.map((a: any) => {
                                                    const isImage = a.contentType?.startsWith('image/') || a.key.endsWith('/thumb');
                                                    const isAudio = a.contentType?.startsWith('audio/');
                                                    const isVideo = a.contentType?.startsWith('video/');

                                                    // Build URL for preview
                                                    let previewUrl = '';
                                                    if (a.key.startsWith('chaos/')) {
                                                        previewUrl = `${API_BASE}/api/chaos/${a.key.split('/')[2]}/content`;
                                                    } else {
                                                        const p = a.key.split('/');
                                                        if (p.length === 3) {
                                                            previewUrl = `${API_BASE}/api/assets/${p[2]}/${p[0]}/${p[1]}`;
                                                        }
                                                    }

                                                    return (
                                                        <div key={a.key} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                                                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                                                                    {isImage ? (
                                                                        <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                                                                    ) : isAudio ? (
                                                                        <HardDrive className="w-6 h-6 text-blue-500" />
                                                                    ) : isVideo ? (
                                                                        <FileImage className="w-6 h-6 text-purple-500" />
                                                                    ) : (
                                                                        <Database className="w-6 h-6 text-slate-400" />
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="font-mono text-xs text-slate-900 dark:text-slate-100 truncate mb-1">{a.key}</div>
                                                                    <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                                                                        <span>{(a.size / 1024 / 1024).toFixed(2)} MB</span>
                                                                        <span>•</span>
                                                                        <span>{a.contentType || 'unknown type'}</span>
                                                                        <span>•</span>
                                                                        <span>{new Date(a.uploaded).toLocaleString()}</span>
                                                                    </div>
                                                                    {isAudio && (
                                                                        <audio src={previewUrl} controls className="h-6 mt-2 max-w-full" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 ml-4">
                                                                <button
                                                                    onClick={() => copyR2LinkToClipboard(a.key)}
                                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                                    title="Copy Direct Link"
                                                                >
                                                                    {copiedAssetId === a.key ? (
                                                                        <Check className="w-5 h-5 text-green-600" />
                                                                    ) : (
                                                                        <LinkIcon className="w-5 h-5" />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteR2(a.key)}
                                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                    title="Delete Object"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    {r2Cursor && (
                                        <div className="flex justify-center pt-4">
                                            <Button variant="secondary" onClick={() => loadData(r2Cursor)} disabled={loading}>
                                                Load More Assets
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )
                        }
                    </div>
                )
                }
                {/* Confirmation Modal */}
                {
                    confirmModal.isOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{confirmModal.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">{confirmModal.body}</p>
                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                        onClick={confirmModal.onConfirm}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
};

