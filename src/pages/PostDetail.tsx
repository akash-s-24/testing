import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Post, Comment } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const EMOTION_COLORS: Record<string, string> = {
    Happy: '#F59E0B',
    Sad: '#6366F1',
    Frustrated: '#EF4444',
    Calm: '#8B5CF6',
    Anxious: '#F97316',
    Melancholy: '#3B82F6',
    Hopeful: '#10B981',
    Overwhelmed: '#EC4899',
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

const generateAlias = () => {
    const adjs = ["Purple", "Silver", "Breezy", "Golden"];
    const nouns = ["Cloud", "Moon", "Ocean", "Mist"];
    return `${adjs[Math.floor(Math.random() * adjs.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 100)}`;
};

export default function PostDetail() {
    const { id } = useParams();
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [commentAlias] = useState(generateAlias());

    useEffect(() => {
        const fetchPostAndComments = async () => {
            if (!id) return;

            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                setUserProfile(profile);
            }

            const { data: postData } = await supabase.from('posts').select('*').eq('id', id).single();
            if (postData) setPost(postData);

            const { data: commentsData } = await supabase
                .from('comments')
                .select(`
          *,
          profiles(username)
        `)
                .eq('post_id', id)
                .order('created_at', { ascending: true });

            if (commentsData) setComments(commentsData);
        };

        fetchPostAndComments();

        if (id) {
            const subscription = supabase
                .channel(`public:comments:post_id=eq.${id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${id}` }, () => {
                    // simple reload
                    supabase.from('comments').select(`*, profiles(username)`).eq('post_id', id).order('created_at', { ascending: true })
                        .then(({ data }) => { if (data) setComments(data); });
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [id]);

    const handleHug = async () => {
        if (!post || !id) return;
        setPost({ ...post, hug_count: post.hug_count + 1 });
        await supabase.from('posts').update({ hug_count: post.hug_count + 1 }).eq('id', id);

        // Auto insert an anonymous notification if it's someone else's post
        if (post.user_id && post.user_id !== userProfile?.id) {
            await supabase.from('notifications').insert([{
                user_id: post.user_id,
                message: `💜 ${isAnonymous ? commentAlias : userProfile?.username} sent you a hug on your story!`
            }]);
        }
    };

    const submitComment = async () => {
        if (!newComment.trim() || !id) return;

        const { data: { session } } = await supabase.auth.getSession();

        const commentRecord = {
            post_id: id,
            user_id: session?.user?.id,
            content: newComment,
            is_anonymous: isAnonymous
        };

        await supabase.from('comments').insert([commentRecord]);

        // Notification
        if (post && post.user_id && post.user_id !== session?.user?.id) {
            await supabase.from('notifications').insert([{
                user_id: post.user_id,
                message: `💬 ${isAnonymous ? commentAlias : userProfile?.username} commented on your story!`
            }]);
        }

        setNewComment('');
    };

    if (!post) {
        return <div className="py-20 text-center text-[#5B2D8E]">Loading story...</div>;
    }

    return (
        <div className="py-8 px-4 max-w-3xl mx-auto flex flex-col gap-6">
            <Link to="/feed" className="flex items-center gap-2 text-slate-500 hover:text-[#5B2D8E] transition-colors w-fit font-medium">
                <ArrowLeft size={16} /> Back to Feed
            </Link>

            {/* Post Content */}
            <div className={cn(
                "bg-white p-8 rounded-3xl shadow-sm border border-slate-100 border-l-4",
                EMOTION_BORDERS[post.emotion] || EMOTION_BORDERS.Default
            )}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: EMOTION_COLORS[post.emotion] || EMOTION_COLORS.Default }} />
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                            {post.alias} • {post.emotion}
                        </span>
                        <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                            {post.category}
                        </span>
                    </div>
                    <span className="text-sm text-slate-400 font-medium">
                        {formatDistanceToNow(new Date(post.created_at))} ago
                    </span>
                </div>

                <h1 className="text-3xl font-bold text-[#1A1A2E] mb-6 leading-tight">{post.title}</h1>
                <p className="text-lg text-slate-700 leading-relaxed mb-10 whitespace-pre-wrap">{post.content}</p>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <button
                        onClick={handleHug}
                        className="flex items-center gap-2 bg-[#8B5CF6]/10 text-[#5B2D8E] px-6 py-3 rounded-full font-bold hover:bg-[#8B5CF6]/20 transition-all shadow-sm active:scale-95"
                    >
                        <Heart size={20} className="fill-[#5B2D8E]" />
                        Send Hug ({post.hug_count})
                    </button>
                    <div className="flex items-center gap-2 text-slate-400 font-bold">
                        <MessageSquare size={20} />
                        {comments.length} Comments
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-8">
                <h3 className="text-xl font-bold text-[#1A1A2E]">Community Responses</h3>

                {/* Add Comment Input */}
                <div className="flex flex-col gap-4 bg-[#FAF8F5] p-6 rounded-2xl border border-slate-100">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Offer support, relate, or simply listen..."
                        className="w-full bg-transparent border-none resize-none focus:ring-0 text-slate-700"
                        rows={3}
                    />
                    <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-2">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={isAnonymous}
                                    onChange={e => setIsAnonymous(e.target.checked)}
                                    className="w-4 h-4 text-[#5B2D8E] rounded focus:ring-[#5B2D8E]"
                                />
                                Post anonymously (as {commentAlias})
                            </label>
                        </div>
                        <button
                            onClick={submitComment}
                            disabled={!newComment.trim()}
                            className="bg-[#5B2D8E] text-white px-6 py-2 rounded-full font-bold shadow-sm hover:bg-[#5B2D8E]/90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Send size={16} /> Send
                        </button>
                    </div>
                </div>

                {/* Existing Comments */}
                <div className="flex flex-col gap-6">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 flex items-center justify-center font-bold text-[#5B2D8E]/40">
                                {comment.is_anonymous ? 'A' : (comment.profiles?.username?.[0]?.toUpperCase() || 'U')}
                            </div>
                            <div>
                                <div className="flex items-baseline gap-3 mb-1">
                                    <span className="font-bold text-[#1A1A2E]">
                                        {comment.is_anonymous ? 'Anonymous Responder' : comment.profiles?.username}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {formatDistanceToNow(new Date(comment.created_at))} ago
                                    </span>
                                </div>
                                <p className="text-slate-600 leading-relaxed text-sm">
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    ))}
                    {comments.length === 0 && (
                        <p className="text-center text-slate-400 py-4 font-medium">No responses yet. Be the first to reach out.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
