import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Coffee, Home, Bookmark, Shield, Bell, MessageSquare, Cloud, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = React.useState(0);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#FAF8F5] font-sans text-[#1A1A2E]">
            {/* Navbar */}
            <nav className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
                    {/* Logo */}
                    <Link to="/feed" className="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                        <div className="w-9 h-9 bg-[#5B2D8E] rounded-lg flex items-center justify-center text-white">
                            <Coffee size={20} fill="currentColor" />
                        </div>
                        <span className="text-xl font-bold text-[#1A1A2E]">LifeTea</span>
                    </Link>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="text-slate-500 hover:text-[#5B2D8E] transition-colors relative">
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[10px] text-white flex items-center justify-center font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </Link>

                        <div className="group relative">
                            <button className="w-9 h-9 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center text-[#5B2D8E] border border-[#5B2D8E]/10">
                                <Cloud size={20} />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                <div className="p-2 space-y-1">
                                    <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">
                                        Dashboard
                                    </Link>
                                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                                        <LogOut size={16} /> Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-[1400px] mx-auto min-h-[calc(100vh-64px)]">
                <Outlet />
            </div>
        </div>
    );
}
