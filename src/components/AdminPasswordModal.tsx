import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, X } from 'lucide-react';
import { Button } from './Button';

interface AdminPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
    title?: string;
    isAuthenticated?: boolean;
}

export const AdminPasswordModal = ({ isOpen, onClose, onConfirm, title = "Admin Verification", isAuthenticated = false }: AdminPasswordModalProps) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(password);
        setPassword('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800"
                data-testid="admin-password-modal"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6 flex flex-col items-center text-center space-y-2">
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full text-red-600 dark:text-red-400">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{title}</h3>
                    <p className="text-sm text-slate-500">
                        {isAuthenticated
                            ? "You are logged in as admin. Confirm to permanently delete this item."
                            : "This action allows permanent deletion. Please verify your identity."
                        }
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isAuthenticated && (
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Admin Password"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                            autoFocus
                            data-testid="admin-password-input"
                        />
                    )}

                    <div className="flex gap-2">
                        <Button variant="ghost" className="flex-1" onClick={onClose} type="button">
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            className="flex-1"
                            type="submit"
                            disabled={!isAuthenticated && !password}
                            data-testid="admin-confirm-delete-btn"
                        >
                            {isAuthenticated ? "Confirm Delete" : "Verify & Delete"}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
