import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Shield, Heart, Sparkles } from 'lucide-react';

export default function Landing() {
    return (
        <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
            {/* Hero Section */}
            <section className="flex-1 relative flex flex-col items-center justify-center text-center px-4 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1A0533 0%, #5B2D8E 100%)' }}>

                <div className="relative z-10 flex flex-col items-center max-w-3xl">
                    <div className="w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center text-white mb-8 shadow-2xl">
                        <Coffee size={40} fill="currentColor" />
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                        LifeTea
                    </h1>

                    <p className="text-2xl md:text-4xl italic text-white/90 mb-8 font-serif">
                        "Pour it out. Be heard."
                    </p>

                    <p className="text-lg md:text-xl text-white/70 mb-12 max-w-xl mx-auto leading-relaxed">
                        A safe, anonymous space to share your story and feel genuinely understood.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                        <Link to="/register" className="px-8 py-4 bg-white text-[#5B2D8E] rounded-full font-bold text-lg hover:bg-white/90 transition-all shadow-lg hover:shadow-xl active:scale-95">
                            Start Pouring
                        </Link>
                        <Link to="/feed" className="px-8 py-4 bg-transparent text-white border-2 border-white/30 rounded-full font-bold text-lg hover:bg-white/10 transition-all active:scale-95">
                            Explore Stories
                        </Link>
                    </div>
                </div>

                {/* Abstract Background Shapes */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8B5CF6] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#EC4899] rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-6 max-w-[1200px] mx-auto w-full">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow text-center">
                        <div className="w-16 h-16 bg-[#5B2D8E]/10 rounded-2xl flex items-center justify-center text-[#5B2D8E] mx-auto mb-6">
                            <Shield size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-[#1A1A2E] mb-3">Post Anonymously</h3>
                        <p className="text-[#6B7280] leading-relaxed">
                            Share your deepest thoughts without fear of judgment. Your identity is protected.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow text-center">
                        <div className="w-16 h-16 bg-[#EC4899]/10 rounded-2xl flex items-center justify-center text-[#EC4899] mx-auto mb-6">
                            <Heart size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-[#1A1A2E] mb-3">Feel Understood</h3>
                        <p className="text-[#6B7280] leading-relaxed">
                            Receive real reactions, virtual hugs, and genuine support from a caring community.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow text-center">
                        <div className="w-16 h-16 bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center text-[#3B82F6] mx-auto mb-6">
                            <Sparkles size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-[#1A1A2E] mb-3">AI-Powered Insights</h3>
                        <p className="text-[#6B7280] leading-relaxed">
                            Smart emotion detection helps you contextualize how you're feeling as you type.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center text-[#6B7280] border-t border-slate-200">
                <p className="text-sm font-medium">LifeTea © 2025 — Pour it out. Be heard.</p>
            </footer>
        </div>
    );
}
