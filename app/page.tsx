"use client";

import { useState, useEffect, useRef } from 'react';
import {
    Menu, FolderOpen, Settings,
    Shirt, Wine, Image as ImageIcon, Plus, Send, MessageSquarePlus
} from 'lucide-react';
import clsx from 'clsx';

// --- Types ---
type Skin = 'alfred' | 'neo' | 'mstramell';
type Mode = 'normal' | 'spice';

type Message = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

// --- Assets ---
// Note: We expect these to be in /public/media/icons/
const ICONS = {
    alfred: '/media/icons/alfred_icon.jpg',
    mstramell: '/media/icons/blind_date_icon.png'
};

export default function Home() {
    // State
    const [skin, setSkin] = useState<Skin>('alfred');
    const [messages, setMessages] = useState<Record<Skin, Message[]>>({
        alfred: [],
        neo: [],
        mstramell: []
    });
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Refs
    const scrollRef = useRef<HTMLDivElement>(null);

    // --- Effects ---

    // 1. Sync Skin to CSS Variables
    useEffect(() => {
        document.documentElement.setAttribute('data-skin', skin);
    }, [skin]);

    // 2. Auto-scroll to bottom of active chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, skin]);

    // 3. Gesture Support (Swipe)
    useEffect(() => {
        const skins: Skin[] = ['alfred', 'neo', 'mstramell'];
        let lastSwitch = 0;
        const COOLDOWN = 800;

        const handleSwitch = (dir: 1 | -1) => {
            const now = Date.now();
            if (now - lastSwitch < COOLDOWN) return;
            lastSwitch = now;

            const idx = skins.indexOf(skin);
            let next = idx + dir;
            if (next >= skins.length) next = 0;
            if (next < 0) next = skins.length - 1;

            setSkin(skins[next]);
        };

        const handleWheel = (e: WheelEvent) => {
            // Horizontal swipe
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                if (Math.abs(e.deltaX) > 30) {
                    handleSwitch(e.deltaX > 0 ? 1 : -1);
                }
            }
        };

        let touchStartX = 0;
        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.touches[0].clientX;
        };
        const handleTouchEnd = (e: TouchEvent) => {
            const diff = e.changedTouches[0].clientX - touchStartX;
            if (diff < -50) handleSwitch(1); // Swipe Left -> Next
            if (diff > 50) handleSwitch(-1); // Swipe Right -> Prev
        };

        window.addEventListener('wheel', handleWheel);
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [skin]);

    // --- Logic ---

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        const text = inputValue.trim();
        setInputValue('');

        // 1. Add User Message
        const newMsg: Message = { role: 'user', content: text };
        setMessages(prev => ({
            ...prev,
            [skin]: [...prev[skin], newMsg]
        }));

        setIsTyping(true);

        try {
            // 2. Determine Mode
            // Alfred -> Normal (Gemini)
            // Neo/MsTramell -> Spice (Venice)
            const apiMode: Mode = skin === 'alfred' ? 'normal' : 'spice';

            // 3. Call API
            const history = messages[skin].concat(newMsg);

            // Filter system prompts if we were doing that client side, 
            // but the API route handles the System Prompt injection based on mode.
            // We just send the conversation history.

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: history,
                    mode: apiMode
                })
            });

            const data = await response.json();

            // 4. Add AI Message
            setMessages(prev => ({
                ...prev,
                [skin]: [...prev[skin], { role: 'assistant', content: data.content }]
            }));

        } catch (error) {
            console.error(error);
            setMessages(prev => ({
                ...prev,
                [skin]: [...prev[skin], { role: 'assistant', content: "Error: Connection Lost." }]
            }));
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    const handleNewChat = () => {
        if (confirm(`Clear history for ${skin}?`)) {
            setMessages(prev => ({ ...prev, [skin]: [] }));
        }
    };

    // --- Render Helpers ---

    return (
        <main className="flex-1 flex flex-col relative h-screen w-screen overflow-hidden"
            style={{ fontFamily: 'var(--font-family)' }}>

            {/* BACKGROUND TRANSITION LAYER (Optional, CSS Vars handle main bg) */}

            {/* SIDEBAR */}
            <aside className="fixed left-0 top-4 bottom-4 w-16 hover:w-64 transition-all duration-300 glass-panel border-r flex flex-col items-center py-6 z-20 overflow-hidden group shadow-2xl rounded-r-2xl">
                <div className="mb-8 p-2 rounded-lg text-[var(--accent-color)] ring-1 ring-[var(--accent-color)]/20">
                    <Menu className="w-6 h-6" />
                </div>
                <div className="flex-1 w-full px-4 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 whitespace-nowrap">
                    <div className="flex items-center gap-3 p-3 hover:bg-[var(--highlight-color)] rounded-lg cursor-pointer transition-colors text-[var(--text-color)]/80 hover:text-[var(--accent-color)]">
                        <FolderOpen className="w-5 h-5" /> <span className="font-medium tracking-wide">Memories</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 hover:bg-[var(--highlight-color)] rounded-lg cursor-pointer transition-colors text-[var(--text-color)]/80 hover:text-[var(--accent-color)]">
                        <Settings className="w-5 h-5" /> <span className="font-medium tracking-wide">Settings</span>
                    </div>
                </div>
            </aside>

            {/* STICKY HEADER */}
            <div className="absolute top-0 left-0 right-0 z-50 flex flex-col items-center pt-6 pointer-events-none">
                {/* Slider */}
                <div className="pointer-events-auto flex gap-6 glass-panel px-6 py-3 rounded-full shadow-lg transition-all duration-500 ring-1 ring-white/10 mb-6">
                    {(['alfred', 'neo', 'mstramell'] as Skin[]).map(s => (
                        <button
                            key={s}
                            onClick={() => setSkin(s)}
                            className={clsx(
                                "w-4 h-4 rounded-full transition-all duration-300",
                                skin === s
                                    ? "bg-[var(--indicator-color)] shadow-[0_0_15px_var(--indicator-color)] scale-125"
                                    : "bg-[var(--text-color)]/20 hover:scale-125"
                            )}
                        />
                    ))}
                </div>

                {/* Avatar Stage */}
                <div className="pointer-events-auto transition-all duration-500">
                    {skin === 'alfred' && (
                        <div className="w-16 h-16 rounded-full shadow-xl animate-fade-in relative overflow-hidden border-2 border-[#404040]">
                            <img
                                src={ICONS.alfred}
                                alt="Alfred"
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; document.getElementById('alf-fallback')!.style.display = 'flex'; }}
                            />
                            <div id="alf-fallback" className="hidden absolute inset-0 bg-[#262626] items-center justify-center text-[#60a5fa]">
                                <Shirt className="w-8 h-8" />
                            </div>
                        </div>
                    )}

                    {skin === 'neo' && (
                        <div className="flex items-center justify-center animate-fade-in">
                            <div className="text-[var(--accent-color)] font-mono text-sm border border-[var(--accent-color)] px-2 py-1 rounded bg-black/50 backdrop-blur">
                                {"> CONNECTED"}
                            </div>
                        </div>
                    )}

                    {skin === 'mstramell' && (
                        <div className="w-16 h-16 rounded-full shadow-[0_0_30px_rgba(197,179,88,0.2)] animate-fade-in overflow-hidden border-2 border-[#c5b358]/90">
                            <img
                                src={ICONS.mstramell}
                                alt="MsTramell"
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; document.getElementById('mst-fallback')!.style.display = 'flex'; }}
                            />
                            <div id="mst-fallback" className="hidden absolute inset-0 bg-[#232020] items-center justify-center text-[#c5b358]">
                                <Wine className="w-8 h-8" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CHAT VIEWPORT */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto pt-[180px] pb-32 px-4 scroll-smooth"
            >
                {/* WELCOME VIEWS (If Empty) */}
                {messages[skin].length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">

                        {skin === 'alfred' && (
                            <>
                                <h1 className="text-3xl font-medium mt-8 mb-2 tracking-tight">Welcome back, Sir!</h1>
                                <p className="text-lg opacity-60 font-light mb-8">Where would you like to start today?</p>
                            </>
                        )}

                        {skin === 'neo' && (
                            <div className="relative w-full max-w-lg mx-auto">
                                <div className="text-[var(--text-color)] text-xs mb-8 opacity-70 absolute -top-24 left-0 text-left font-mono">
                                    {"> SYSTEM_ROOT_ACCESS: GRANTED"}<br />
                                    {"> PROTOCOL: RABBIT_HOLE"}
                                </div>
                                <h1 className="text-5xl font-bold mb-8 tracking-widest drop-shadow-[0_0_10px_rgba(34,197,94,0.5)] neo-text">
                                    LOCKED ON.
                                </h1>
                                <p className="text-2xl leading-relaxed neo-text font-mono">
                                    How deep in the rabbit hole<br />are we diving today?
                                    <span className="neo-cursor" />
                                </p>
                            </div>
                        )}

                        {skin === 'mstramell' && (
                            <h1 className="text-4xl italic mt-12 mb-4 text-[#dcd0b3]">
                                Hello, stranger...
                            </h1>
                        )}

                    </div>
                )}

                {/* MESSAGES */}
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages[skin].map((msg, i) => (
                        <div
                            key={i}
                            className={clsx(
                                "flex w-full animate-fade-in",
                                msg.role === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            <div className={clsx(
                                "px-6 py-3 rounded-2xl border backdrop-blur-sm shadow-sm max-w-[85%] text-lg",
                                msg.role === 'user'
                                    ? "bg-[var(--accent-color)]/20 border-[var(--accent-color)]/30 rounded-tr-sm text-[var(--text-color)]"
                                    : "bg-[var(--panel-color)] border-[var(--border-color)] rounded-tl-sm text-[var(--text-color)]"
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start w-full animate-fade-in">
                            <div className="bg-[var(--panel-color)] border border-[var(--border-color)] px-4 py-2 rounded-2xl rounded-tl-sm text-[var(--text-color)] opacity-60 text-sm">
                                ...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* INPUT AREA */}
            <div className="absolute bottom-10 left-0 right-0 px-8 flex justify-center z-20 pointer-events-none">
                <div className="w-full max-w-3xl flex items-end gap-3 pointer-events-auto">

                    {/* Tools */}
                    <div className="flex flex-col gap-3">
                        <button onClick={handleNewChat} className="p-3 rounded-full hover:bg-[var(--accent-color)] hover:text-white transition-all text-[var(--text-color)]/60 hover:shadow-lg glass-panel">
                            <MessageSquarePlus className="w-6 h-6" />
                        </button>
                        <button className="p-3 rounded-full hover:bg-[var(--accent-color)] hover:text-white transition-all text-[var(--text-color)]/60 hover:shadow-lg glass-panel">
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Input Field */}
                    <div
                        className="flex-1 glass-panel rounded-2xl p-2 shadow-2xl flex items-center focus-within:ring-1 focus-within:ring-[var(--accent-color)]/50 transition-all duration-300"
                        style={{ backgroundColor: 'var(--input-bg)' }}
                    >
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent px-6 py-4 outline-none text-lg min-w-0 font-inherit"
                            style={{
                                color: 'var(--input-text-color)',
                                caretColor: 'var(--caret-color)'
                            }}
                        />

                        <button
                            onClick={() => setInputValue(p => "/image " + p)}
                            className="p-3.5 mr-1 rounded-xl hover:bg-[var(--highlight-color)] text-[var(--text-color)]/50 hover:text-[var(--accent-color)] transition-all"
                        >
                            <ImageIcon className="w-6 h-6" />
                        </button>
                        <button
                            onClick={handleSend}
                            className="p-3.5 rounded-xl hover:bg-[var(--highlight-color)] text-[var(--text-color)]/50 hover:text-[var(--accent-color)] transition-all"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

        </main>
    );
}
