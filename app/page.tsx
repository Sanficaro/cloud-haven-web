"use client";

import { useEffect } from 'react';
import { Menu, FolderOpen, Settings, MessageSquarePlus, Plus, Send, Image as ImageIcon } from 'lucide-react';

export default function Home() {
    useEffect(() => {
        changeSkin('alfred');

        const skins = ['alfred', 'neo', 'mstramell'];
        let lastSwitchTime = 0;
        const COOLDOWN = 800;

        function getNextSkin(direction: number) {
            const currentSkin = document.documentElement.getAttribute('data-skin') || 'alfred';
            const currentIndex = skins.indexOf(currentSkin as any);
            let nextIndex = currentIndex + direction;
            if (nextIndex >= skins.length) nextIndex = 0;
            if (nextIndex < 0) nextIndex = skins.length - 1;
            return skins[nextIndex];
        }

        function triggerSwitch(direction: number) {
            const now = Date.now();
            if (now - lastSwitchTime < COOLDOWN) return;
            lastSwitchTime = now;
            const nextSkin = getNextSkin(direction);
            changeSkin(nextSkin);
        }

        const handleWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                if (Math.abs(e.deltaX) > 30) {
                    triggerSwitch(e.deltaX > 0 ? 1 : -1);
                }
            }
        };

        let touchStartX = 0;
        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.touches[0].clientX;
        };
        const handleTouchEnd = (e: TouchEvent) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchEndX - touchStartX;
            if (diff < -50) triggerSwitch(1);
            if (diff > 50) triggerSwitch(-1);
        };

        document.addEventListener('wheel', handleWheel);
        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('wheel', handleWheel);
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);

    return (
        <>
            <aside className="w-16 hover:w-64 transition-all duration-300 glass-panel border-r flex flex-col items-center py-6 z-20 overflow-hidden group shadow-2xl relative mr-4 rounded-r-2xl my-4 ml-0 h-[calc(100vh-2rem)]">
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

            <div className="flex-1 flex flex-col relative w-full h-full">
                <div className="sticky-header">
                    <div className="skin-slider flex gap-6 glass-panel px-6 py-3 rounded-full shadow-lg transition-all duration-500 ring-1 ring-white/10">
                        <button onClick={() => changeSkin('alfred')} id="dot-alfred" className="w-4 h-4 rounded-full bg-[var(--text-color)]/20 hover:scale-125 transition-all duration-300"></button>
                        <button onClick={() => changeSkin('neo')} id="dot-neo" className="w-4 h-4 rounded-full bg-[var(--text-color)]/20 hover:scale-125 transition-all duration-300"></button>
                        <button onClick={() => changeSkin('mstramell')} id="dot-mstramell" className="w-4 h-4 rounded-full bg-[var(--text-color)]/20 hover:scale-125 transition-all duration-300"></button>
                    </div>

                    <div className="avatar-stage">
                        <div id="avatar-alfred" className="avatar-view w-16 h-16 rounded-full shadow-xl">
                            <img src="/media/icons/alfred_icon.jpg" alt="Alfred" className="rounded-avatar alfred-border" />
                        </div>

                        <div id="avatar-neo" className="avatar-view items-center justify-center">
                            <div className="text-[var(--accent-color)] font-mono text-sm border border-[var(--accent-color)] px-2 py-1 rounded bg-black/50 backdrop-blur">
                                &gt; CONNECTED
                            </div>
                        </div>

                        <div id="avatar-mstramell" className="avatar-view w-16 h-16 rounded-full shadow-[0_0_30px_rgba(197,179,88,0.2)]">
                            <img src="/media/icons/blind_date_icon.png" alt="MsTramell" className="rounded-avatar mstramell-border" />
                        </div>
                    </div>
                </div>

                <main className="flex-1 chat-viewport" id="chat-viewport">
                    <div id="chat-alfred" className="chat-section active items-center text-center">
                        <h1 className="text-3xl font-medium mt-8 mb-2 tracking-tight">Welcome back, Sir!</h1>
                        <p className="text-lg opacity-60 font-light mb-8">Where would you like to start today?</p>
                    </div>

                    <div id="chat-neo" className="chat-section h-full w-full justify-center items-center text-center relative">
                        <div className="text-[var(--text-color)] text-xs mb-8 opacity-70 absolute top-0 left-10 text-left font-mono">
                            &gt; SYSTEM_ROOT_ACCESS: GRANTED<br/>
                            &gt; PROTOCOL: RABBIT_HOLE
                        </div>
                        <h1 className="text-5xl font-bold mb-8 tracking-widest drop-shadow-[0_0_10px_rgba(34,197,94,0.5)] neo-text">
                            LOCKED ON.
                        </h1>
                        <p className="text-2xl leading-relaxed neo-text">
                            How deep in the rabbit hole<br/>are we diving today?<span className="neo-cursor"></span>
                        </p>
                    </div>

                    <div id="chat-mstramell" className="chat-section items-center text-center">
                        <h1 className="text-4xl italic mt-12 mb-4 text-[#dcd0b3]">Hello, stranger...</h1>
                    </div>
                </main>

                <div className="absolute bottom-10 left-0 right-0 px-8 flex justify-center z-20">
                    <div className="w-full max-w-3xl flex items-end gap-3">
                        <div className="flex flex-col gap-3">
                            <button onClick={() => alert('New Chat Started.')} className="p-3 rounded-full hover:bg-[var(--accent-color)] hover:text-white transition-all text-[var(--text-color)]/60 hover:shadow-lg glass-panel">
                                <MessageSquarePlus className="w-6 h-6" />
                            </button>
                            <button className="p-3 rounded-full hover:bg-[var(--accent-color)] hover:text-white transition-all text-[var(--text-color)]/60 hover:shadow-lg glass-panel">
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 glass-panel rounded-2xl p-2 shadow-2xl flex items-center focus-within:ring-1 focus-within:ring-[var(--accent-color)]/50 transition-all duration-300" style={{ backgroundColor: 'var(--input-bg)' }}>
                            <input type="text" id="user-input" placeholder="Type..." className="flex-1 bg-transparent px-6 py-4 outline-none text-lg min-w-0 font-inherit" autoComplete="off" />
                            
                            <button onClick={() => { 
                                const input = document.getElementById('user-input') as HTMLInputElement; 
                                if (input) {
                                    input.value = '/image ' + input.value; 
                                    input.focus(); 
                                }
                            }} className="p-3.5 mr-1 rounded-xl hover:bg-[var(--highlight-color)] text-[var(--text-color)]/50 hover:text-[var(--accent-color)] transition-all">
                                <ImageIcon className="w-6 h-6" />
                            </button>
                            <button onClick={() => alert('Send button clicked')} className="p-3.5 rounded-xl hover:bg-[var(--highlight-color)] text-[var(--text-color)]/50 hover:text-[var(--accent-color)] transition-all">
                                <Send className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function changeSkin(skin: string) {
    document.documentElement.setAttribute('data-skin', skin);
    document.querySelectorAll('.chat-section').forEach(el => el.classList.remove('active'));
    document.getElementById(chat-{skin})?.classList.add('active');
    document.querySelectorAll('.avatar-view').forEach(el => el.classList.remove('active'));
    document.getElementById(vatar-{skin})?.classList.add('active');
    
    ['alfred', 'neo', 'mstramell'].forEach(s => {
        const dot = document.getElementById(dot-{s});
        if (!dot) return;
        if (s === skin) {
            dot.classList.add('bg-[var(--indicator-color)]', 'shadow-[0_0_15px_var(--indicator-color)]', 'scale-125');
            dot.classList.remove('bg-[var(--text-color)]/20');
        } else {
            dot.classList.remove('bg-[var(--indicator-color)]', 'shadow-[0_0_15px_var(--indicator-color)]', 'scale-125');
            dot.classList.add('bg-[var(--text-color)]/20');
        }
    });
}
