import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Trash2, Edit2, BookmarkMinus, CheckCircle2, Clock, Smile, Sparkles, Bell, Heart, BookOpen } from 'lucide-react';
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

    // Edit Modal State
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

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

    const handleUnsave = async (postId: string) => {
        if (!profile) return;
        setSavedPosts(prev => prev.filter(sp => sp.post_id !== postId));
        await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', profile.id);
    };

    const handleDelete = async (postId: string) => {
        if (!confirm("Are you sure you want to delete this story?")) return;
        setPosts(prev => prev.filter(p => p.id !== postId));
        setStats(prev => ({ ...prev, totalPosts: prev.totalPosts - 1 }));
        await supabase.from('posts').delete().eq('id', postId);
    };

    const openEdit = (post: Post) => {
        setEditingPost(post);
        setEditTitle(post.title || '');
        setEditContent(post.content || '');
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPost) return;
        setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, title: editTitle, content: editContent } : p));
        await supabase.from('posts').update({ title: editTitle, content: editContent }).eq('id', editingPost.id);
        setEditingPost(null);
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
            <div className="bg-gradient-to-br from-[#4c1d95] via-[#5B2D8E] to-[#7c3aed] text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border border-[#8B5CF6]/30">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/20 to-transparent rounded-bl-full mix-blend-overlay opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#EC4899]/20 blur-[80px] rounded-full"></div>

                <div className="flex flex-col md:flex-row gap-10 items-center relative z-10">
                    <div className="relative">
                        <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-pulse"></div>
                        <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-xl border-2 border-white/40 text-5xl shadow-xl relative z-10 hover:scale-105 transition-transform duration-500 cursor-default">
                            {profile?.username?.[0]?.toUpperCase() || '👤'}
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-4xl font-extrabold mb-2 tracking-tight drop-shadow-md">{profile?.username || 'Your Dashboard'}</h1>
                        <p className="text-purple-200 font-bold mb-8 tracking-widest uppercase text-xs opacity-90">
                            Member since {profile ? format(new Date(profile.created_at), 'MMMM yyyy') : 'Recently'}
                        </p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-4 hover:bg-white/20 transition-all cursor-default shadow-lg">
                                <div className="p-2.5 bg-white/20 rounded-xl"><Edit2 size={22} className="text-purple-50" /></div>
                                <div className="text-left">
                                    <p className="text-2xl font-black text-white leading-none drop-shadow-sm">{stats.totalPosts}</p>
                                    <p className="text-[10px] font-extrabold text-white/70 uppercase tracking-widest mt-1">Stories</p>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-4 hover:bg-white/20 transition-all cursor-default shadow-lg">
                                <div className="p-2.5 bg-white/20 rounded-xl"><Heart size={22} className="text-purple-50 fill-purple-50/20" /></div>
                                <div className="text-left">
                                    <p className="text-2xl font-black text-white leading-none drop-shadow-sm">{stats.totalHugs}</p>
                                    <p className="text-[10px] font-extrabold text-white/70 uppercase tracking-widest mt-1">Hugs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-[1.25rem] overflow-x-auto scrollbar-none w-fit border border-slate-200/50 shadow-inner">
                {[
                    { id: 'mood', label: 'My Mood', icon: <Sparkles size={16} /> },
                    { id: 'posts', label: 'My Stories', icon: <Edit2 size={16} /> },
                    { id: 'saved', label: 'Saved Stories', icon: <BookmarkMinus size={16} /> },
                    { id: 'notifications', label: `Notifications ${notifications.filter(n => !n.is_read).length > 0 ? `(${notifications.filter(n => !n.is_read).length})` : ''}`, icon: <Bell size={16} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-all whitespace-nowrap rounded-xl ${activeTab === tab.id
                                ? 'bg-white text-[#5B2D8E] shadow-sm border border-slate-200/50'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
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
                            <div key={post.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:border-purple-200 transition-all duration-300 flex flex-col items-start group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#5B2D8E]/5 to-transparent rounded-bl-full"></div>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">{format(new Date(post.created_at), 'MMM dd, yyyy')}</span>
                                <h3 className="font-extrabold text-xl text-[#1A1A2E] mb-3 line-clamp-2 leading-tight">{post.title}</h3>
                                <p className="text-slate-600 mb-6 line-clamp-3 leading-relaxed text-sm">{post.content}</p>
                                <div className="mt-auto w-full flex items-center justify-between border-t border-slate-100 pt-5">
                                    <span className="text-[11px] font-extrabold text-[#5B2D8E] bg-[#5B2D8E]/10 px-4 py-1.5 rounded-full shadow-sm shadow-[#5B2D8E]/10 border border-[#5B2D8E]/10">{post.emotion}</span>
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                        <button onClick={() => openEdit(post)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(post.id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {posts.length === 0 && (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 bg-white shadow-sm rounded-[2rem] border border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Edit2 size={32} className="text-slate-300" /></div>
                                <p className="font-extrabold text-xl text-[#1A1A2E]">No stories shared yet.</p>
                                <p className="text-sm mt-2 text-slate-400">Pour your heart out and they will appear here.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'saved' && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedPosts.map(sp => (
                            <div key={sp.id} className="bg-gradient-to-b from-white to-slate-50/50 p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-start hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 hover:border-slate-300 transition-all duration-300 group relative cursor-pointer" onClick={() => window.location.href = `/post/${sp.post_id}`}>
                                <span className="text-[10px] font-extrabold text-[#5B2D8E] uppercase tracking-widest mb-3 flex items-center gap-1.5"><BookmarkMinus size={14} /> Saved Story</span>
                                <h3 className="font-extrabold text-xl text-[#1A1A2E] mb-3 line-clamp-2 pr-8 leading-tight">{sp.posts.title}</h3>
                                <p className="text-slate-600 mb-2 line-clamp-3 leading-relaxed text-sm">{sp.posts.content}</p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleUnsave(sp.post_id); }}
                                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0"
                                    title="Unsave Post"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        {savedPosts.length === 0 && (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 bg-white shadow-sm rounded-[2rem] border border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><BookmarkMinus size={32} className="text-slate-300" /></div>
                                <p className="font-extrabold text-xl text-[#1A1A2E]">No saved stories.</p>
                                <p className="text-sm mt-2 text-slate-400">Bookmark stories from the community feed.</p>
                            </div>
                        )}
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

            {/* Edit Modal */}
            {editingPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setEditingPost(null)} className="absolute top-6 right-6 text-slate-400 hover:text-[#1A1A2E]">✕</button>
                        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-6">Edit Story</h2>
                        <form onSubmit={handleEditSubmit} className="flex flex-col gap-6">
                            <input
                                type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} required
                                className="w-full text-xl font-bold text-[#1A1A2E] border-slate-200 rounded-xl px-4 py-3 placeholder:text-slate-300 focus:border-[#5B2D8E] focus:ring-[#5B2D8E]"
                                placeholder="Story Title"
                            />
                            <textarea
                                value={editContent} onChange={e => setEditContent(e.target.value)} required
                                className="w-full min-h-[200px] text-slate-700 border-slate-200 rounded-xl px-4 py-3 resize-y focus:border-[#5B2D8E] focus:ring-[#5B2D8E]"
                                placeholder="Write your story..."
                            />
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setEditingPost(null)} className="px-6 py-2.5 rounded-full font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                                <button type="submit" className="bg-[#5B2D8E] text-white px-8 py-2.5 rounded-full font-bold hover:bg-[#5B2D8E]/90 transition-all shadow-sm">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
