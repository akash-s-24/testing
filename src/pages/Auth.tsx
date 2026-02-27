import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coffee, Mail, Lock, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Auth({ type }: { type: 'login' | 'register' }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (type === 'register') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) throw error;

                // Profiles table RLS requires user to log in first, but signUp signs them in automatically.
                if (data.user) {
                    const { error: profileError } = await supabase.from('profiles').insert([
                        { id: data.user.id, username, is_anonymous_default: true }
                    ]);
                    if (profileError) {
                        console.error("Profile creation error:", profileError);
                    }
                }

                navigate('/feed');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigate('/feed');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
            <Link to="/" className="mb-8 flex items-center gap-2 group">
                <div className="w-12 h-12 bg-[#5B2D8E] rounded-xl flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-lg">
                    <Coffee size={24} fill="currentColor" />
                </div>
                <span className="text-3xl font-bold text-[#5B2D8E]">LifeTea</span>
            </Link>

            <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-[#1A1A2E] text-center mb-8">
                    {type === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {type === 'register' && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-[#1A1A2E] pl-1">Username</label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#5B2D8E]/20 focus:border-[#5B2D8E] transition-all"
                                    placeholder="Your public username"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-[#1A1A2E] pl-1">Email address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#5B2D8E]/20 focus:border-[#5B2D8E] transition-all"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-[#1A1A2E] pl-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#5B2D8E]/20 focus:border-[#5B2D8E] transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#5B2D8E] text-white py-3.5 rounded-xl font-bold text-lg hover:bg-[#5B2D8E]/90 transition-all active:scale-95 disabled:opacity-70 mt-4 shadow-md hover:shadow-lg"
                    >
                        {loading ? 'Processing...' : type === 'login' ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-[#6B7280]">
                    {type === 'login' ? (
                        <p>
                            Don't have an account?{' '}
                            <Link to="/register" className="text-[#5B2D8E] font-bold hover:underline">
                                Sign up
                            </Link>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{' '}
                            <Link to="/login" className="text-[#5B2D8E] font-bold hover:underline">
                                Sign in
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
