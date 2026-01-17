"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, MoreVertical, Sparkles, Loader2, Zap, Eye } from 'lucide-react';

import { SCARLET_PRIME } from '../../data';

interface BlindDateCharacter {
    id: string;
    name: string;
    tagline: string;
    image: string;
    visuals: any;
    bio: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatPage() {
    const router = useRouter();
    const params = useParams();
    const [character, setCharacter] = useState<BlindDateCharacter | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Auto-scroll ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load Character
        if (params.id === SCARLET_PRIME.id) {
            setCharacter(SCARLET_PRIME);
            return;
        }

        const saved = localStorage.getItem('haven_blind_dates');
        if (saved) {
            const chars = JSON.parse(saved);
            const found = chars.find((c: any) => c.id === params.id);
            if (found) {
                setCharacter(found);
            } else {
                router.push('/haven?skin=blind_date');
            }
        } else {
            router.push('/haven?skin=blind_date');
        }
    }, [params.id, router]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // Auto-generate image if requested by AI
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content.includes('[IMAGE_PROMPT:')) {
            const match = lastMsg.content.match(/\[IMAGE_PROMPT: (.*?)\]/);
            if (match && match[1]) {
                handleGenerateImage(match[1]);
            }
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !character || isLoading) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch('/api/blind_date/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({
                        role: m.role,
                        content: m.content.startsWith('[IMAGE]') ? '[Sends a photo]' : m.content
                    })),
                    character: character
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
            }
        } catch (error) {
            console.error("Chat Failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!character) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Connection...</div>;

    // Resolve Image URL (Handle fallback logic here too just in case)
    const imageUrl = character.image && (character.image.startsWith('data:image') || character.image.startsWith('http') || character.image.startsWith('/'))
        ? character.image
        : `https://gen.pollinations.ai/image/portrait%20of%20${encodeURIComponent(character.name)}%20woman%20photorealistic%208k?width=512&height=512&nologo=true`;

    // Override header image for Scarlet Prime
    const headerImage = character.id === 'scarlet-prime' ? '/media/images/Scarlet.png' : imageUrl;

    const compressImage = async (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            const timeout = setTimeout(() => reject("Image load timeout"), 10000);

            img.onload = () => {
                clearTimeout(timeout);
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { reject("No Canvas"); return; }

                    const MAX_SIZE = 512;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = (e) => {
                clearTimeout(timeout);
                reject(e);
            };
            img.src = url;
        });
    };



    const handleGenerateImage = async (specificPrompt?: string) => {
        if (!character || isLoading) return;
        setIsLoading(true);

        try {
            let prompt = "";

            if (specificPrompt) {
                prompt = `A selfie of ${character.name}, a ${character.visuals.ethnicity} woman, ${character.visuals.hairColor} hair, ${character.visuals.style} style. Scenario: ${specificPrompt}`;
                // If triggered by AI, we don't need the optimistic "snaps a photo" message as the AI likely already introduced it.
            } else {
                // Button Click Contextual Prompt
                const lastContext = messages.slice(-5).map(m =>
                    `${m.role === 'user' ? 'User' : character.name}: ${m.content}`
                ).join(' | ');
                const contextString = lastContext ? `Current Situation: ${lastContext.slice(0, 300)}` : "Starting a new conversation.";
                prompt = `A selfie of ${character.name}, a ${character.visuals.ethnicity} woman, ${character.visuals.hairColor} hair, ${character.visuals.style} style. ${contextString}`;

                // Add optimistic message only for button clicks
                setMessages(prev => [...prev, { role: 'assistant', content: `*snaps a photo for you*` }]);
            }

            const res = await fetch('/api/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt, skin: 'blind_date' })
            });

            if (!res.ok) throw new Error("API Failure");

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const compressed = await compressImage(url);

            setMessages(prev => [...prev, { role: 'assistant', content: `[IMAGE] ${compressed}` }]);

        } catch (e) {
            console.error("Gen Failed", e);
            setMessages(prev => [...prev, { role: 'assistant', content: `*tries to take a photo but the app crashes* (Image Generation Failed)` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateVideo = () => {
        // Optimistic video placeholder
        setMessages(prev => [...prev, { role: 'assistant', content: `*tries to record a video message but realizes the feature is locked* Oops! Video messages are coming in the next update. 😘` }]);
    };

    return (
        <div className="h-screen bg-[#050505] text-[#d4af37] flex flex-col font-serif overflow-hidden relative">
            {/* Venetian Hall Background Overlay */}
            <div className="fixed inset-0 bg-[url('/media/design/venetian_hall_bg.png')] bg-cover bg-center opacity-20 pointer-events-none" />

            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-4 border-b border-[#d4af37]/30 bg-[#050505]/90 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            >
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/haven?skin=blind_date')} className="p-2 hover:bg-[#d4af37]/10 rounded-full transition-colors group">
                        <ArrowLeft className="w-6 h-6 text-[#d4af37] group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#d4af37]/50 shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                                <img src={headerImage} alt={character.name} className="w-full h-full object-cover filter contrast-125" />
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse shadow-[0_0_5px_#22c55e]"></div>
                        </div>
                        <div>
                            <h1 className="font-bold text-xl leading-tight tracking-wide text-[#d4af37]" style={{ fontFamily: 'Times New Roman, serif' }}>{character.name}</h1>
                            <p className="text-xs text-[#8a1c1c] uppercase tracking-widest flex items-center gap-1 font-bold">
                                In The Circle
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleGenerateImage()} className="p-3 hover:bg-[#d4af37]/10 rounded-full transition-all text-[#d4af37] hover:scale-110 hover:rotate-12" title="The Eye (Visualise Context)">
                        <Eye className="w-6 h-6" />
                    </button>
                    <button onClick={handleGenerateVideo} className="p-3 hover:bg-[#d4af37]/10 rounded-full transition-all text-[#8a1c1c] hover:text-red-500" title="The Voice (Locked)">
                        <Zap className="w-5 h-5" />
                    </button>
                    <button className="p-3 hover:bg-[#d4af37]/10 rounded-full transition-colors text-[#d4af37]/50 hover:text-[#d4af37]">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </motion.header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-8 relative z-0">

                {/* Intro / System Note */}
                <div className="flex justify-center my-8">
                    <div className="bg-[#1a0505] border border-[#d4af37]/30 rounded-none p-4 text-xs text-[#d4af37]/70 text-center max-w-sm tracking-widest uppercase font-serif shadow-lg">
                        <Eye className="w-4 h-4 mx-auto mb-2 text-[#d4af37]" />
                        The Ritual has begun with {character.name}. <br />
                        Style: {character.visuals.style}. <br />
                        Speak carefully.
                    </div>
                </div>

                {/* Initial Empty State Hint */}
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-[#d4af37]/30 space-y-4 opacity-70">
                        <div className="p-6 bg-[#1a0505] rounded-full border border-[#d4af37]/20">
                            <Send className="w-8 h-8" />
                        </div>
                        <p className="tracking-[0.2em] uppercase font-serif text-sm">Initiate Contact</p>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`
                                max-w-[85%] p-6 text-sm md:text-base leading-relaxed relative shadow-[0_4px_15px_rgba(0,0,0,0.5)]
                                ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-[#4a0404] to-[#2a0202] text-[#ffdddd] border border-[#ff4444]/20 rounded-t-lg rounded-bl-lg'
                                    : 'bg-[#0a0a0a]/90 backdrop-blur-sm text-[#d4af37] border border-[#d4af37]/30 rounded-t-lg rounded-br-lg'}
                            `} style={{ fontFamily: msg.role === 'assistant' ? 'Times New Roman, serif' : 'sans-serif' }}>
                                {msg.content.startsWith('[IMAGE]') ? (
                                    <div className="rounded-sm overflow-hidden border-2 border-[#d4af37] p-1 bg-black">
                                        <img src={msg.content.replace('[IMAGE] ', '')} alt="Generated connection" className="w-full h-auto object-cover max-w-full" />
                                    </div>
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-[#0a0a0a] border border-[#d4af37]/30 p-4 rounded-t-lg rounded-br-lg flex gap-3 items-center shadow-lg">
                            <span className="text-xs text-[#d4af37] font-serif uppercase tracking-widest hidden md:block">{character.name} is writing...</span>
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce delay-75" />
                                <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce delay-150" />
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-[#050505]/95 border-t border-[#d4af37]/30 backdrop-blur-xl sticky bottom-0 z-20">
                <div className="max-w-4xl mx-auto relative flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={`Whisper to ${character.name}...`}
                        className="flex-1 bg-[#1a0505] border border-[#d4af37]/30 rounded-none px-6 py-4 focus:outline-none focus:border-[#d4af37] text-[#d4af37] placeholder-[#d4af37]/30 transition-all font-serif italic tracking-wide"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="p-4 bg-[#4a0404] hover:bg-[#6a0606] disabled:opacity-50 disabled:hover:bg-[#4a0404] rounded-none border border-[#d4af37]/50 text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
