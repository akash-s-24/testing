import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const EMOTION_COLORS: Record<string, string> = {
    Happy: '#F59E0B', Sad: '#6366F1', Frustrated: '#EF4444',
    Calm: '#8B5CF6', Anxious: '#F97316', Melancholy: '#3B82F6',
    Hopeful: '#10B981', Overwhelmed: '#EC4899', Default: '#CBD5E1'
};

const detectEmotion = async (text: string): Promise<string> => {
    if (text.length < 20) return 'Neutral';
    try {
        const res = await fetch("https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inputs: text })
        });
        const data = await res.json();
        if (!data || !data[0]) return 'Neutral';
        const top = data[0].reduce((a: any, b: any) => a.score > b.score ? a : b);
        const map: Record<string, string> = { joy: 'Happy', sadness: 'Sad', anger: 'Frustrated', fear: 'Anxious', surprise: 'Hopeful', disgust: 'Overwhelmed', neutral: 'Calm' };
        return map[top.label] || 'Neutral';
    } catch { return 'Neutral'; }
};

const generateAlias = () => "Anonymous" + Math.floor(Math.random() * 1000);

export default function CreatePost() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [aiDetected, setAiDetected] = useState('');
    const [selectedEmotion, setSelectedEmotion] = useState('Neutral');
    const [category, setCategory] = useState('Other');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [alias] = useState(generateAlias());

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (content.length >= 20) {
                const emo = await detectEmotion(content);
                setAiDetected(emo);
                if (selectedEmotion === 'Neutral') setSelectedEmotion(emo);
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [content]);

    const submitPost = async () => {
        if (!title || !content) return;
        setIsPosting(true);
        const { data: { session } } = await supabase.auth.getSession();

        await supabase.from('posts').insert([{
            user_id: session?.user?.id,
            title, content, is_anonymous: isAnonymous,
            alias: isAnonymous ? alias : 'User',
            emotion: selectedEmotion === 'Neutral' && aiDetected ? aiDetected : selectedEmotion,
            category, hug_count: 0
        }]);

        navigate('/feed');
    };

    return (
        <div className="py-8 px-4 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-[#1A1A2E] mb-8">Create New Story</h1>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-6">
                <input
                    type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="Give your story a meaningful title..."
                    className="w-full text-2xl font-bold text-[#1A1A2E] placeholder:text-slate-300 border-none focus:ring-0 p-0"
                />

                <textarea
                    value={content} onChange={e => setContent(e.target.value)}
                    placeholder="Pour it out..."
                    className="w-full border-none p-0 text-lg resize-none focus:ring-0 min-h-[240px] text-slate-700 placeholder:text-slate-400"
                />

                <div className="flex flex-col gap-4 pt-6 border-t border-slate-100">
                    {aiDetected && content.length > 20 && (
                        <span className="text-sm bg-purple-50 text-[#5B2D8E] px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 w-fit">
                            <Sparkles size={16} /> 🤖 AI Detects: {aiDetected}
                        </span>
                    )}

                    <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block tracking-wide uppercase">Select Emotion</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(EMOTION_COLORS).filter(k => k !== 'Default').map(emo => (
                                <button
                                    key={emo} onClick={() => setSelectedEmotion(emo)}
                                    className={cn("px-4 py-2 rounded-full text-sm font-bold transition-all", selectedEmotion === emo ? "text-white shadow-md scale-105" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}
                                    style={selectedEmotion === emo ? { backgroundColor: EMOTION_COLORS[emo] } : {}}
                                >
                                    {emo}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <select value={category} onChange={e => setCategory(e.target.value)} className="border-slate-200 rounded-xl text-slate-700 font-medium">
                            {['College', 'Work', 'Relationships', 'Family', 'Health', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-600">
                            <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="rounded text-[#5B2D8E] focus:ring-[#5B2D8E]" />
                            Post Anonymously
                        </label>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={submitPost} disabled={!title || !content || isPosting}
                        className="bg-[#5B2D8E] text-white px-8 py-3 rounded-full font-bold hover:bg-[#5B2D8E]/90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        <Send size={18} /> Post Story
                    </button>
                </div>
            </div>
        </div>
    );
}
