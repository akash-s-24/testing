import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Trash2, Edit2, BookmarkMinus, CheckCircle2, Clock, Smile, Sparkles, Bell } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Post, LifeTeaNotification, SavedPost } from '../types';

const EMOTION_SCORES: Record<string, number> = {
    Happy: 9,
    Hopeful: 8,
    Calm: 7,
    Melancholy: 4,
    Sad: 3,
    Anxious: 3,
    Frustrated: 2,
    Overwhelmed: 1,
    Default: 5
};

const EMOTION_EMOJIS: Record<string, string> = {
    Happy: '😊',
    Hopeful: '✨',
    Calm: '😌',
    Melancholy: '🌧️',
    Sad: '😢',
    Anxious: '😰',
    Frustrated: '😤',
    Overwhelmed: '😵',
    Default: '😐'
};

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<'posts' | 'mood' | 'saved' | 'notifications'>('mood');
    const [posts, setPosts] = useState<Post[]>([]);
    const [savedPosts, setSavedPosts] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<LifeTeaNotification[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ totalPosts: 0, totalHugs: 0 });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 1. Profile
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(prof);

        // 2. Posts & Stats
        const { data: myPosts } = await supabase.from('posts').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (myPosts) {
            setPosts(myPosts);
            const hugs = myPosts.reduce((acc, p) => acc + (p.hug_count || 0), 0);
            setStats({ totalPosts: myPosts.length, totalHugs: hugs });
        }

        // 3. Saved Posts
        const { data: sPosts } = await supabase
            .from('saved_posts')
            .select('*, posts(*)')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
        if (sPosts) setSavedPosts(sPosts);

        // 4. Notifications
        const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (notifs) setNotifications(notifs);
    };

    const markAllRead = async () => {
        if (!profile) return;
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const moodData = [...posts]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(p => ({
            date: format(new Date(p.created_at), 'MMM dd'),
            score: EMOTION_SCORES[p.emotion] || EMOTION_SCORES.Default,
            emotion: p.emotion,
            title: p.title
        }));

    // Find most frequent emotion this week (dummy implementation since not full week data might exist)
    const currentVibe = posts.length > 0 ? posts[0].emotion : 'Neutral';

    return (
        <div className="py-8 px-4 max-w-5xl mx-auto flex flex-col gap-8">

            {/* Top Header Card */}
            <div className="bg-[#5B2D8E] text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-bl-full mix-blend-overlay"></div>
                <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/30 text-4xl">
                        {profile?.username?.[0]?.toUpperCase() || '👤'}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-bold mb-2">{profile?.username || 'Your Dashboard'}</h1>
                        <p className="text-[#8B5CF6] font-medium mb-4 tracking-wide uppercase text-sm">
                            Member since {profile ? format(new Date(profile.created_at), 'MMMM yyyy') : 'Recently'}
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-8">
                            <div>
                                <p className="text-3xl font-bold text-white mb-1">{stats.totalPosts}</p>
                                <p className="text-sm font-medium text-white/70">Stories Shared</p>
                            </div>
                            <div className="w-px h-10 bg-white/20"></div>
                            <div>
                                <p className="text-3xl font-bold text-white mb-1">{stats.totalHugs}</p>
                                <p className="text-sm font-medium text-white/70">Virtual Hugs Received</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 border-b border-slate-200 overflow-x-auto scrollbar-none">
                {[
                    { id: 'mood', label: 'My Mood' },
                    { id: 'posts', label: 'My Stories' },
                    { id: 'saved', label: 'Saved Stories' },
                    { id: 'notifications', label: `Notifications ${notifications.filter(n => !n.is_read).length > 0 ? `(${notifications.filter(n => !n.is_read).length})` : ''}` }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-4 px-2 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-[#5B2D8E]' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5B2D8E]" />
                        )}
                    </button>
                ))}
            </div>

            {/* TABS CONTENT */}
            <div className="min-h-[400px]">
                {activeTab === 'mood' && (
                    <div className="flex flex-col gap-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="text-5xl">{EMOTION_EMOJIS[currentVibe] || '😐'}</div>
                                <div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Current Vibe</p>
                                    <p className="text-2xl font-bold text-[#1A1A2E]">{currentVibe}</p>
                                </div>
                            </div>
                            <div className="col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                <h3 className="text-lg font-bold text-[#1A1A2E] mb-6">Sentiment Journey</h3>
                                <div className="h-64">
                                    {moodData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={moodData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                                                <YAxis hide domain={[0, 10]} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    labelStyle={{ color: '#64748B', fontSize: '12px', fontWeight: 'bold' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke="#5B2D8E"
                                                    strokeWidth={4}
                                                    dot={{ fill: '#8B5CF6', r: 6, strokeWidth: 2, stroke: '#FFF' }}
                                                    activeDot={{ r: 8 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400">Not enough stories yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'posts' && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map(post => (
                            <div key={post.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-start hover:shadow-md transition-all group">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{format(new Date(post.created_at), 'MMM dd, yyyy')}</span>
                                <h3 className="font-bold text-lg text-[#1A1A2E] mb-3 line-clamp-2">{post.title}</h3>
                                <p className="text-sm text-slate-500 mb-6 line-clamp-3">{post.content}</p>
                                <div className="mt-auto w-full flex items-center justify-between border-t border-slate-100 pt-4">
                                    <span className="text-sm font-bold text-[#5B2D8E] bg-[#5B2D8E]/10 px-3 py-1 rounded-full">{post.emotion}</span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-50"><Edit2 size={16} /></button>
                                        <button className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {posts.length === 0 && <p className="text-slate-500 col-span-full">You haven't shared any stories yet.</p>}
                    </div>
                )}

                {activeTab === 'saved' && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedPosts.map(sp => (
                            <div key={sp.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-start hover:shadow-md transition-all group relative">
                                <h3 className="font-bold text-lg text-[#1A1A2E] mb-3 line-clamp-2 pr-8">{sp.posts.title}</h3>
                                <p className="text-sm text-slate-500 mb-6 line-clamp-3">{sp.posts.content}</p>
                                <button className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors">
                                    <BookmarkMinus size={20} />
                                </button>
                            </div>
                        ))}
                        {savedPosts.length === 0 && <p className="text-slate-500 col-span-full">You haven't saved any stories yet.</p>}
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <span className="font-bold text-[#1A1A2E]">Recent Activity</span>
                            <button onClick={markAllRead} className="text-sm font-bold text-[#5B2D8E] hover:underline flex items-center gap-1">
                                <CheckCircle2 size={16} /> Mark all read
                            </button>
                        </div>
                        <div className="flex flex-col divide-y divide-slate-100">
                            {notifications.map(n => (
                                <div key={n.id} className={`p-4 flex gap-4 transition-colors ${!n.is_read ? 'bg-[#5B2D8E]/5 border-l-4 border-l-[#5B2D8E]' : 'border-l-4 border-l-transparent bg-white hover:bg-slate-50'}`}>
                                    <div className="w-10 h-10 rounded-full bg-[#5B2D8E]/10 flex items-center justify-center text-[#5B2D8E] shrink-0 font-bold">
                                        {n.message.includes('hug') ? '💜' : '💬'}
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <p className={`text-sm ${!n.is_read ? 'text-[#1A1A2E] font-medium' : 'text-slate-600'}`}>{n.message}</p>
                                        <p className="text-xs text-slate-400 mt-1">{formatDistanceToNow(new Date(n.created_at))} ago</p>
                                    </div>
                                </div>
                            ))}
                            {notifications.length === 0 && <div className="p-8 text-center text-slate-500 font-medium"><Bell className="mx-auto mb-2 opacity-50" /> You're all caught up!</div>}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
