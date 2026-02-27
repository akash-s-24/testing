import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Home, Bookmark, Shield, Clock, Smile, Sparkles, Send, Bell, Cloud, Search, Share2, MessageSquare, Image as ImageIcon, Trash2, MoreHorizontal, Coffee } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Post, Profile } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const EMOTION_COLORS: Record<string, string> = {
    Happy: '#F59E0B',      // amber
    Sad: '#6366F1',        // indigo
    Frustrated: '#EF4444', // red
    Calm: '#8B5CF6',       // lavender
    Anxious: '#F97316',    // orange
    Melancholy: '#3B82F6', // blue
    Hopeful: '#10B981',    // green
    Overwhelmed: '#EC4899',// pink
    Default: '#CBD5E1'
};

const EMOTION_BORDERS: Record<string, string> = {
    Happy: 'border-amber-500',
    Sad: 'border-indigo-500',
    Frustrated: 'border-red-500',
    Calm: 'border-purple-400',
    Anxious: 'border-orange-500',
    Melancholy: 'border-blue-500',
    Hopeful: 'border-emerald-500',
    Overwhelmed: 'border-pink-500',
    Default: 'border-slate-200'
};

const detectEmotion = async (text: string): Promise<string> => {
    if (text.length < 20) return 'Neutral';
    try {
        const res = await fetch(
            "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inputs: text })
            }
        );
        const data = await res.json();
        if (!data || !data[0]) return 'Neutral';

        // data[0] is array of {label, score}
        const top = data[0].reduce((a: any, b: any) => a.score > b.score ? a : b);

        // Map Hugging Face labels to LifeTea emotions
        const map: Record<string, string> = {
            joy: 'Happy',
            sadness: 'Melancholy', // or Sad
            anger: 'Frustrated',
            fear: 'Anxious',
            surprise: 'Hopeful',
            disgust: 'Overwhelmed',
            neutral: 'Calm'
        };

        return map[top.label] || 'Neutral';
    } catch (err) {
        console.error("AI Error", err);
        return 'Neutral';
    }
};

const generateAlias = () => {
    const adjs = ["Purple", "Silver", "Breezy", "Golden", "Crimson", "Silent", "Wandering"];
    const nouns = ["Cloud", "Moon", "Ocean", "Mist", "Leaf", "Spirit", "Traveler"];
    const adj = adjs[Math.floor(Math.random() * adjs.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 100);
    return `${adj}${noun}${num}`;
};

export default function Feed() {
    const [activeTab, setActiveTab] = useState<'community' | 'trending' | 'following'>('community');
    const [activeMenu, setActiveMenu] = useState('My Space');
    const [filterEmotion, setFilterEmotion] = useState('All');

    // Post Composer State
    const [isComposerExpanded, setIsComposerExpanded] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedEmotion, setSelectedEmotion] = useState('Neutral');
    const [aiDetected, setAiDetected] = useState('');
    const [category, setCategory] = useState('Other');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [alias, setAlias] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    // Data State
    const [posts, setPosts] = useState<Post[]>([]);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [moodRingData, setMoodRingData] = useState<any[]>([]);

    // Debounced AI Emotion Detection
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (content.length >= 20) {
                const emo = await detectEmotion(content);
                setAiDetected(emo);
                // Auto select if user hasn't manually selected yet
                if (selectedEmotion === 'Neutral') setSelectedEmotion(emo);
            } else {
                setAiDetected('');
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [content]);

    // Load Data & Setup Real-time
    useEffect(() => {
        const loadData = async () => {
            // 1. Get current user profile
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                setUserProfile(profile);
            }

            // 2. Load Posts
            fetchPosts();

            // 3. Load Mood Ring Data
            fetchMoodRing();
        };

        loadData();
        setAlias(generateAlias());

        // 4. Supabase Subscription for new posts & hugs
        const subscription = supabase
            .channel('public:posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
                // Simple reload for hackathon
                fetchPosts();
                fetchMoodRing();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [filterEmotion]);

    const fetchPosts = async () => {
        let query = supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (filterEmotion !== 'All') {
            query = query.eq('emotion', filterEmotion);
        }
        const { data: postsData } = await query;
        if (postsData) setPosts(postsData);
    };

    const fetchMoodRing = async () => {
        // Hackathon approximation: count posts grouped by emotion client-side over recent posts
        const { data: recentPosts } = await supabase
            .from('posts')
            .select('emotion')
            .order('created_at', { ascending: false })
            .limit(100);

        if (recentPosts) {
            const counts: Record<string, number> = {};
            recentPosts.forEach(p => {
                counts[p.emotion] = (counts[p.emotion] || 0) + 1;
            });
            const ring = Object.keys(counts).map(k => ({
                name: k,
                value: counts[k],
                color: EMOTION_COLORS[k] || EMOTION_COLORS.Default
            }));
            setMoodRingData(ring.sort((a, b) => b.value - a.value));
        }
    };

    const submitPost = async () => {
        if (!title.trim() || !content.trim()) return;
        setIsPosting(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const newPost = {
                user_id: session?.user?.id,
                title,
                content,
                is_anonymous: isAnonymous,
                alias: isAnonymous ? alias : userProfile?.username,
                emotion: selectedEmotion === 'Neutral' && aiDetected ? aiDetected : selectedEmotion,
                category,
                hug_count: 0
            };

            await supabase.from('posts').insert([newPost]);

            // Reset composer
            setTitle('');
            setContent('');
            setSelectedEmotion('Neutral');
            setIsComposerExpanded(false);
            setAlias(generateAlias());

        } catch (err) {
            console.error(err);
        } finally {
            setIsPosting(false);
        }
    };

    const handleHug = async (postId: string) => {
        // Optimistic UI update
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, hug_count: p.hug_count + 1 } : p));

        // DB Update: increment by 1
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        await supabase.from('posts').update({ hug_count: post.hug_count + 1 }).eq('id', postId);

        // Send Notification if we wanted to
    };

    const dominantEmotion = moodRingData.length > 0 ? moodRingData[0].name : "Calm";

    // Calculate total posts count for the mood ring subtitle
    const totalRecentPosts = moodRingData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="py-8 flex flex-col md:flex-row gap-8 px-4 md:px-0">

            {/* LEFT SIDEBAR */}
            <aside className="hidden md:flex flex-col w-[240px] shrink-0 gap-6">
                {/* User Card */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center text-[#5B2D8E] overflow-hidden">
                            <Smile size={24} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold text-[#1A1A2E] truncate">{userProfile?.username || 'Loading...'}</p>
                            <p className="text-xs text-slate-400 truncate">Anonymous Traveler</p>
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="flex flex-col gap-1">
                    {[
                        { name: 'My Space', icon: Home },
                        { name: 'Saved Stories', icon: Bookmark },
                    ].map((item) => (
                        <button
                            key={item.name}
                            onClick={() => setActiveMenu(item.name)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-sm",
                                activeMenu === item.name
                                    ? "bg-[#8B5CF6]/10 text-[#5B2D8E]"
                                    : "text-slate-500 hover:bg-white hover:shadow-sm"
                            )}
                        >
                            <item.icon size={18} />
                            {item.name}
                        </button>
                    ))}
                </div>

                {/* Overwhelmed Helper */}
                <div className="bg-white p-5 rounded-2xl border border-[#8B5CF6]/30 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#5B2D8E]/5 rounded-bl-full" />
                    <p className="font-bold text-[#5B2D8E] mb-1">Feeling helpful?</p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        Several members are feeling 'Overwhelmed' today.
                    </p>
                    <button className="w-full bg-[#5B2D8E]/10 text-[#5B2D8E] py-2.5 rounded-xl text-sm font-bold hover:bg-[#5B2D8E]/20 transition-all active:scale-95">
                        Send Support
                    </button>
                </div>
            </aside>

            {/* CENTER FEED */}
            <main className="flex-1 min-w-0 flex flex-col gap-6">
                {/* Post Composer Card */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    {!isComposerExpanded ? (
                        <div className="flex gap-4 cursor-text" onClick={() => setIsComposerExpanded(true)}>
                            <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
                                <Smile className="text-slate-400" size={20} />
                            </div>
                            <div className="flex-1 bg-slate-50 rounded-xl px-4 py-2.5 text-slate-400 border border-slate-100 flex items-center hover:bg-slate-100 transition-colors">
                                Pour it out... Share your story anonymously
                            </div>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">

                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#5B2D8E]/10 text-[#5B2D8E] shrink-0 flex items-center justify-center font-bold">
                                        {alias.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-[#1A1A2E]">Posting as <span className="text-[#5B2D8E]">{isAnonymous ? alias : userProfile?.username}</span></p>
                                        <label className="flex items-center gap-2 cursor-pointer mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={isAnonymous}
                                                onChange={e => setIsAnonymous(e.target.checked)}
                                                className="w-3 h-3 text-[#5B2D8E] rounded focus:ring-[#5B2D8E]"
                                            />
                                            <span className="text-xs text-slate-500">Stay anonymous</span>
                                        </label>
                                    </div>
                                </div>
                                <button onClick={() => setIsComposerExpanded(false)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">Cancel</button>
                            </div>

                            <input
                                type="text"
                                placeholder="Give your story a title..."
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full text-lg font-bold text-[#1A1A2E] placeholder:text-slate-300 border-none focus:ring-0 p-0"
                            />
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What's on your mind? Take your time..."
                                className="w-full border-none p-0 text-sm resize-none focus:ring-0 min-h-[120px] text-slate-700 placeholder:text-slate-400"
                            />

                            {/* AI Badge & Overrides */}
                            <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {aiDetected && content.length > 20 && (
                                            <span className="text-xs bg-[#8B5CF6]/10 text-[#5B2D8E] px-2 py-1 rounded-md font-medium flex items-center gap-1">
                                                <Sparkles size={12} /> AI Detects: {aiDetected}
                                            </span>
                                        )}
                                    </div>
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="text-xs border-slate-200 rounded-lg text-slate-600 focus:ring-[#5B2D8E]"
                                    >
                                        {['College', 'Work', 'Relationships', 'Family', 'Health', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                {/* Emotion Selector */}
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(EMOTION_COLORS).filter(k => k !== 'Default').map(emo => (
                                        <button
                                            key={emo}
                                            onClick={() => setSelectedEmotion(emo)}
                                            className={cn(
                                                "text-xs px-3 py-1.5 rounded-full font-medium transition-all",
                                                selectedEmotion === emo
                                                    ? "ring-2 ring-offset-1 text-white scale-105 shadow-sm"
                                                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                            )}
                                            style={{
                                                backgroundColor: selectedEmotion === emo ? EMOTION_COLORS[emo] : undefined
                                            }}
                                        >
                                            {emo}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={submitPost}
                                    disabled={!title || !content || isPosting}
                                    className="bg-[#5B2D8E] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#5B2D8E]/90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Send size={16} />
                                    {isPosting ? 'Posting...' : 'Post Story'}
                                </button>
                            </div>

                        </motion.div>
                    )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <button
                        onClick={() => setFilterEmotion('All')}
                        className={cn("px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all", filterEmotion === 'All' ? "bg-slate-800 text-white" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50")}
                    >
                        All
                    </button>
                    {Object.keys(EMOTION_COLORS).filter(k => k !== 'Default').map(emo => (
                        <button
                            key={emo}
                            onClick={() => setFilterEmotion(emo)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border",
                                filterEmotion === emo ? "text-white scale-105" : "bg-white text-slate-500 hover:bg-slate-50 border-slate-200"
                            )}
                            style={filterEmotion === emo ? { backgroundColor: EMOTION_COLORS[emo], borderColor: EMOTION_COLORS[emo] } : {}}
                        >
                            {emo}
                        </button>
                    ))}
                </div>

                {/* Feed Posts */}
                <div className="flex flex-col gap-4">
                    <AnimatePresence mode="popLayout">
                        {posts.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <Coffee size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-500 font-medium mb-4">No stories yet. Be the first to pour it out!</p>
                                <button onClick={() => setIsComposerExpanded(true)} className="bg-[#5B2D8E] text-white px-6 py-2 rounded-full font-bold">Create Post</button>
                            </motion.div>
                        ) : posts.map((post) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={cn(
                                    "bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 hover:shadow-md transition-shadow relative group",
                                    EMOTION_BORDERS[post.emotion || 'Default']
                                )}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EMOTION_COLORS[post.emotion] || EMOTION_COLORS.Default }} />
                                        <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                                            {post.alias} • {post.emotion} • {post.category || 'General'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(post.created_at))} ago</span>
                                        <button className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">{post.title}</h3>
                                <p className="text-slate-600 leading-relaxed mb-6 line-clamp-3">
                                    {post.content}
                                </p>

                                <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => handleHug(post.id)}
                                            className="flex items-center gap-2 bg-[#8B5CF6]/10 text-[#5B2D8E] px-4 py-2 rounded-full text-sm font-bold hover:bg-[#8B5CF6]/20 transition-all active:scale-95 group/btn border border-[#8B5CF6]/10"
                                        >
                                            <motion.div whileTap={{ scale: 1.4, rotate: -15 }}>
                                                <Heart size={16} className="fill-[#5B2D8E]" />
                                            </motion.div>
                                            Send Hug ({post.hug_count})
                                        </button>
                                        <button className="flex items-center gap-2 text-slate-400 hover:text-[#5B2D8E] transition-colors text-sm font-bold">
                                            <MessageSquare size={16} />
                                            Comments
                                        </button>
                                    </div>
                                    <button className="text-slate-400 hover:text-[#5B2D8E] transition-colors">
                                        <Share2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </main>

            {/* RIGHT SIDEBAR */}
            <aside className="w-full md:w-[280px] shrink-0 flex flex-col gap-6">
                {/* Mood Ring Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-[#1A1A2E] mb-4">Community Mood Ring</h3>

                    {moodRingData.length > 0 ? (
                        <>
                            <div className="relative w-48 h-48 mx-auto mb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={moodRingData}
                                            innerRadius={65}
                                            outerRadius={85}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                            animationDuration={1500}
                                            animationBegin={200}
                                        >
                                            {moodRingData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">CURRENT VIBE</span>
                                    <span className="text-xl font-bold text-[#5B2D8E] leading-tight mt-1">{dominantEmotion}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 mb-6 max-h-40 overflow-y-auto scrollbar-none">
                                {moodRingData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-sm font-medium text-slate-600">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: item.color }}>
                                            {Math.round((item.value / totalRecentPosts) * 100)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-10 text-slate-400">
                            <p className="text-sm">Not enough data to form a ring yet.</p>
                        </div>
                    )}

                    <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 text-slate-600 text-sm font-bold hover:bg-slate-100 transition-all border border-slate-100">
                        <Sparkles size={16} />
                        See Historic Trends
                    </button>
                </div>

                {/* Trending Now */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <span className="text-xs font-black text-slate-400 tracking-widest uppercase mb-4 block">TRENDING NOW</span>
                    <div className="flex flex-wrap gap-2">
                        {['#WorkLife', '#CollegeStruggles', '#Healing', '#Relationships'].map((tag) => (
                            <button key={tag} className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-all border border-slate-100">
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>
        </div>
    );
}
