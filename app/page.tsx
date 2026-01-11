'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  FolderOpen,
  Settings,
  Shirt,
  Wine,
  MessageSquarePlus,
  Plus,
  Image as ImageIcon,
  Send
} from 'lucide-react';

type Skin = 'alfred' | 'neo' | 'mstramell';

type Message = { role: 'user' | 'system'; content: string };

export default function HavenPage() {
  const [currentSkin, setCurrentSkin] = useState<Skin>('alfred');
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<Record<Skin, Message[]>>({
    alfred: [],
    neo: [],
    mstramell: []
  });

  const viewportRef = useRef<HTMLDivElement>(null);

  // Sync skin with DOM for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-skin', currentSkin);
  }, [currentSkin]);

  // Auto-scroll chat
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [chatHistory, currentSkin]);

  const changeSkin = (skin: Skin) => {
    setCurrentSkin(skin);
  };

  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text) return;

    // Add user message immediately
    const newUserMsg: Message = { role: 'user', content: text };
    const updatedHistory = [...chatHistory[currentSkin], newUserMsg];

    setChatHistory(prev => ({
      ...prev,
      [currentSkin]: updatedHistory
    }));
    setInputValue('');

    try {
      // Call Backend API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory,
          skin: currentSkin
        })
      });

      if (!response.ok) throw new Error("API Request Failed");

      const data = await response.json();

      // Add System Reply
      setChatHistory(prev => ({
        ...prev,
        [currentSkin]: [...prev[currentSkin], { role: 'system', content: data.text }]
      }));

    } catch (error) {
      console.error(error);
      setChatHistory(prev => ({
        ...prev,
        [currentSkin]: [...prev[currentSkin], { role: 'system', content: "Error: Could not connect to Haven Core." }]
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const triggerGenerate = () => {
    setInputValue(prev => "/image " + prev);
    // Focus logic would ideally go here via ref
  };

  const clearChat = () => {
    alert("New Chat Started.");
  };

  return (
    <main suppressHydrationWarning className="relative w-full h-full overflow-hidden flex">
      {/* SIDEBAR */}
      <aside className="w-16 hover:w-64 transition-all duration-300 glass-panel border-r flex flex-col items-center py-6 z-20 overflow-hidden group shadow-2xl relative mr-4 rounded-r-2xl my-4 ml-0 h-[calc(100vh-2rem)]">
        <div className="mb-8 p-2 rounded-lg text-[var(--accent-color)] ring-1 ring-[var(--accent-color)]/20">
          <Menu className="w-6 h-6" />
        </div>
        <div className="flex-1 w-full px-4 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 whitespace-nowrap">
          <div className="flex items-center gap-3 p-3 hover:bg-[var(--highlight-color)] rounded-lg cursor-pointer transition-colors text-[var(--text-color)]/80 hover:text-[var(--accent-color)]">
            <FolderOpen className="w-5 h-5" />
            <span className="font-medium tracking-wide">Memories</span>
          </div>
          <div className="flex items-center gap-3 p-3 hover:bg-[var(--highlight-color)] rounded-lg cursor-pointer transition-colors text-[var(--text-color)]/80 hover:text-[var(--accent-color)]">
            <Settings className="w-5 h-5" />
            <span className="font-medium tracking-wide">Settings</span>
          </div>
        </div>
      </aside>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col relative w-full h-full">

        {/* STICKY HEADER */}
        <div className="sticky-header">
          <div className="skin-slider flex gap-6 glass-panel px-6 py-3 rounded-full shadow-lg transition-all duration-500 ring-1 ring-white/10">
            {(['alfred', 'neo', 'mstramell'] as Skin[]).map((skin) => (
              <button
                key={skin}
                onClick={() => changeSkin(skin)}
                className={`w-4 h-4 rounded-full hover:scale-125 transition-all duration-300 ${currentSkin === skin
                  ? 'bg-[var(--indicator-color)] shadow-[0_0_15px_var(--indicator-color)] scale-125'
                  : 'bg-[var(--text-color)]/20'
                  }`}
              />
            ))}
          </div>

          <div className="avatar-stage">
            {/* Alfred Icon */}
            <div className={`avatar-view w-16 h-16 rounded-full shadow-xl ${currentSkin === 'alfred' ? 'active' : ''}`}>
              <img
                src="/media/icons/alfred_icon.jpg"
                alt="Alfred"
                className="rounded-avatar alfred-border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '';
                  // This is a simplified fallback handling for React:
                  // In a real app we'd swap components, but we'll stick to CSS logic mostly.
                }}
              />
              {/* Fallback implemented via conditional rendering or error boundary in fuller app. 
                  For now we rely on the img loading successfully as verified. */}
            </div>

            {/* Neo Icon */}
            <div className={`avatar-view items-center justify-center ${currentSkin === 'neo' ? 'active' : ''}`}>
              <div className="text-[var(--accent-color)] font-mono text-sm border border-[var(--accent-color)] px-2 py-1 rounded bg-black/50 backdrop-blur">
                &gt; CONNECTED
              </div>
            </div>

            {/* MsTramell Icon */}
            <div className={`avatar-view w-16 h-16 rounded-full shadow-[0_0_30px_rgba(197,179,88,0.2)] ${currentSkin === 'mstramell' ? 'active' : ''}`}>
              <img
                src="/media/icons/blind_date_icon.png"
                alt="MsTramell"
                className="rounded-avatar mstramell-border"
              />
            </div>
          </div>
        </div>

        {/* CHAT AREA */}
        <main className="flex-1 chat-viewport" ref={viewportRef}>

          {/* ALFRED HISTORY */}
          <div className={`chat-section items-center text-center ${currentSkin === 'alfred' ? 'active' : ''}`}>
            <h1 className="text-3xl font-medium mt-8 mb-2 tracking-tight">Welcome back, Sir!</h1>
            <p className="text-lg opacity-60 font-light mb-8">Where would you like to start today?</p>

            {/* Messages */}
            <div className="w-full flex flex-col gap-2">
              {chatHistory.alfred.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} p-4 w-full animate-fade-in`}>
                  <div className={`${msg.role === 'user'
                    ? 'bg-[var(--accent-color)]/20 text-[var(--text-color)] rounded-tr-sm border-[var(--accent-color)]/30'
                    : 'bg-[var(--panel-color)] text-[var(--text-color)] rounded-tl-sm border-[var(--border-color)]'} 
                            px-6 py-3 rounded-2xl border inline-block text-lg backdrop-blur-sm shadow-sm max-w-[80%] text-left`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NEO HISTORY */}
          <div className={`chat-section h-full w-full justify-center items-center text-center relative ${currentSkin === 'neo' ? 'active' : ''}`}>

            {/* Background Text for Neo */}
            <div className="text-[var(--text-color)] text-xs mb-8 opacity-70 absolute top-0 left-10 text-left font-mono">
              &gt; SYSTEM_ROOT_ACCESS: GRANTED<br />
              &gt; PROTOCOL: RABBIT_HOLE
            </div>

            {chatHistory.neo.length === 0 && (
              <>
                <h1 className="text-5xl font-bold mb-8 tracking-widest drop-shadow-[0_0_10px_rgba(34,197,94,0.5)] neo-text">
                  LOCKED ON.
                </h1>
                <p className="text-2xl leading-relaxed neo-text">
                  How deep in the rabbit hole<br />are we diving today?<span className="neo-cursor"></span>
                </p>
              </>
            )}

            {/* Messages */}
            <div className="w-full flex flex-col gap-2 z-10 mt-20">
              {chatHistory.neo.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} p-4 w-full animate-fade-in`}>
                  <div className={`${msg.role === 'user'
                    ? 'bg-[var(--accent-color)]/20 text-[var(--text-color)] rounded-tr-sm border-[var(--accent-color)]/30'
                    : 'bg-[var(--panel-color)] text-[var(--text-color)] rounded-tl-sm border-[var(--border-color)]'} 
                            px-6 py-3 rounded-2xl border inline-block text-lg backdrop-blur-sm shadow-sm max-w-[80%] text-left neo-text`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MSTRAMELL HISTORY */}
          <div className={`chat-section items-center text-center ${currentSkin === 'mstramell' ? 'active' : ''}`}>
            <h1 className="text-4xl italic mt-12 mb-4 text-[#dcd0b3]">Hello, stranger...</h1>

            {/* Messages */}
            <div className="w-full flex flex-col gap-2">
              {chatHistory.mstramell.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} p-4 w-full animate-fade-in`}>
                  <div className={`${msg.role === 'user'
                    ? 'bg-[var(--accent-color)]/20 text-[var(--text-color)] rounded-tr-sm border-[var(--accent-color)]/30'
                    : 'bg-[var(--panel-color)] text-[var(--text-color)] rounded-tl-sm border-[var(--border-color)]'} 
                            px-6 py-3 rounded-2xl border inline-block text-lg backdrop-blur-sm shadow-sm max-w-[80%] text-left font-serif`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>

        {/* INPUT BAR */}
        <div className="absolute bottom-10 left-0 right-0 px-8 flex justify-center z-20">
          <div className="w-full max-w-3xl flex items-end gap-3">
            <div className="flex flex-col gap-3">
              <button
                onClick={clearChat}
                className="p-3 rounded-full hover:bg-[var(--accent-color)] hover:text-white transition-all text-[var(--text-color)]/60 hover:shadow-lg glass-panel">
                <MessageSquarePlus className="w-6 h-6" />
              </button>
              <button className="p-3 rounded-full hover:bg-[var(--accent-color)] hover:text-white transition-all text-[var(--text-color)]/60 hover:shadow-lg glass-panel">
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <div
              className="flex-1 glass-panel rounded-2xl p-2 shadow-2xl flex items-center focus-within:ring-1 focus-within:ring-[var(--accent-color)]/50 transition-all duration-300"
              style={{ backgroundColor: 'var(--input-bg)' }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type..."
                className="flex-1 bg-transparent px-6 py-4 outline-none text-lg min-w-0 font-inherit"
                autoComplete="off"
                id="user-input"
              />

              <button
                onClick={triggerGenerate}
                className="p-3.5 mr-1 rounded-xl hover:bg-[var(--highlight-color)] text-[var(--text-color)]/50 hover:text-[var(--accent-color)] transition-all">
                <ImageIcon className="w-6 h-6" />
              </button>
              <button
                onClick={handleSendMessage}
                className="p-3.5 rounded-xl hover:bg-[var(--highlight-color)] text-[var(--text-color)]/50 hover:text-[var(--accent-color)] transition-all">
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
