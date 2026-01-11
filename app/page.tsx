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
  Upload,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMobileInputs, setShowMobileInputs] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const skins: Skin[] = ['alfred', 'neo', 'mstramell'];

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const cycleSkin = (direction: 'next' | 'prev') => {
    const currentIndex = skins.indexOf(currentSkin);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= skins.length) newIndex = 0;
    if (newIndex < 0) newIndex = skins.length - 1;

    setCurrentSkin(skins[newIndex]);
  };

  // --- GESTURES (Exact Port from HTML) ---
  const lastSwitchTime = useRef(0);
  const COOLDOWN = 800; // ms

  useEffect(() => {
    // WHEEL / TRACKPAD SWIPE
    const handleWheel = (e: WheelEvent) => {
      // Check for horizontal scroll (trackpad usually)
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        if (Math.abs(e.deltaX) > 30) {
          triggerSwitch(e.deltaX > 0 ? 'next' : 'prev');
        }
      }
    };

    // TOUCH SWIPE
    let touchStartX = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX;
      if (diff < -25) triggerSwitch('next'); // Swipe Left -> Next (Right)
      if (diff > 25) triggerSwitch('prev');  // Swipe Right -> Prev (Left)
    };

    const triggerSwitch = (direction: 'next' | 'prev') => {
      const now = Date.now();
      if (now - lastSwitchTime.current < COOLDOWN) return;

      lastSwitchTime.current = now;

      setCurrentSkin(prevSkin => {
        const skins: Skin[] = ['alfred', 'neo', 'mstramell'];
        const currentIndex = skins.indexOf(prevSkin);
        let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

        if (newIndex >= skins.length) newIndex = 0;
        if (newIndex < 0) newIndex = skins.length - 1;

        return skins[newIndex];
      });
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
    if (isMobile) {
      // Mobile: Enter = newline, Shift+Enter = send
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    } else {
      // Desktop: Enter = send, Shift+Enter = newline
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
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
    <main
      suppressHydrationWarning
      className="relative w-full h-full overflow-hidden flex"
    >
      {/* SIDEBAR */}
      {/* SIDEBAR (Desktop + Mobile Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[100] bg-[var(--panel-color)] backdrop-blur-xl border-r border-[var(--border-color)]
        transform transition-transform duration-300 ease-in-out
        w-64 flex flex-col py-6 shadow-2xl
        ${(isMobileMenuOpen || isSidebarOpen) ? 'translate-x-0' : '-translate-x-full md:-translate-x-full'}
      `}>
        {/* Branding (Always Visible in Drawer) */}
        <div className="w-full px-6 mb-8 mt-20">
          <h2 className="text-2xl font-bold tracking-tighter text-[var(--text-color)]">Haven.ai</h2>
          <p className="text-xs text-[var(--text-color)]/50 mt-1">v. pz8</p>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* New Chat Button */}
        <div className="w-full px-4 mb-4">
          <button
            onClick={clearChat}
            className="w-full flex items-center gap-3 p-3 bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20 rounded-lg cursor-pointer transition-colors text-[var(--accent-color)] hover:text-[var(--accent-color)] border border-[var(--accent-color)]/30"
          >
            <MessageSquarePlus className="w-5 h-5" />
            <span className="font-medium tracking-wide">New Chat</span>
          </button>
        </div>

        {/* Bottom Navigation */}
        <div className="w-full px-4 space-y-2 whitespace-nowrap">
          <div className="flex items-center gap-3 p-3 hover:bg-[var(--highlight-color)] rounded-lg cursor-pointer transition-colors text-[var(--text-color)]/80 hover:text-[var(--accent-color)]">
            <FolderOpen className="w-5 h-5" />
            <span className="font-medium tracking-wide">Memories</span>
          </div>
          <div className="flex items-center gap-3 p-3 hover:bg-[var(--highlight-color)] rounded-lg cursor-pointer transition-colors text-[var(--text-color)]/80 hover:text-[var(--accent-color)]">
            <Settings className="w-5 h-5" />
            <span className="font-medium tracking-wide">Settings</span>
          </div>
        </div>

        {/* Footer Branding */}
        <div className="w-full px-6 mt-4">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-color)]/30">
            Roberto Sansone
          </p>
        </div>
      </aside>

      {/* Edge-Mounted Sidebar Toggle Buttons */}
      {/* Close Button (visible when sidebar is open) */}
      <button
        onClick={() => {
          setIsMobileMenuOpen(false);
          setIsSidebarOpen(false);
        }}
        className={`fixed top-1/2 -translate-y-1/2 left-[256px] z-[110] p-2 rounded-r-lg bg-[var(--panel-color)] backdrop-blur-md border border-l-0 border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--highlight-color)] transition-all shadow-lg ${(isMobileMenuOpen || isSidebarOpen) ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Open Button (visible when sidebar is closed) */}
      <button
        onClick={() => {
          setIsMobileMenuOpen(true);
          setIsSidebarOpen(true);
        }}
        className={`fixed top-1/2 -translate-y-1/2 left-0 z-50 p-2 rounded-r-lg bg-[var(--panel-color)] backdrop-blur-md border border-l-0 border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--highlight-color)] transition-all shadow-lg ${(isMobileMenuOpen || isSidebarOpen) ? 'opacity-0 invisible' : 'opacity-100 visible'
          }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col relative w-full h-full">

        {/* STICKY HEADER */}
        <div className="sticky-header">
          <div className="skin-slider flex gap-6 glass-panel px-6 py-3 rounded-full shadow-lg transition-all duration-500 ring-1 ring-white/10">
            {skins.map((skin) => (
              <button
                key={skin}
                onClick={() => changeSkin(skin)}
                className={`w-6 h-6 rounded-full hover:scale-125 transition-all duration-300 ${currentSkin === skin
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
          <div className={`chat-section text-center ${currentSkin === 'alfred' ? 'active' : ''} ${chatHistory.alfred.length === 0 ? 'justify-center h-full' : 'items-center'}`}>
            <div className={`${chatHistory.alfred.length === 0 ? 'mb-0' : 'mt-8 mb-4'}`}>
              <h1 className="text-3xl font-medium mb-2 tracking-tight">Welcome back, Sir!</h1>
              <p className="text-lg opacity-60 font-light">Where would you like to start today?</p>
            </div>

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
          <div className={`chat-section text-center ${currentSkin === 'mstramell' ? 'active' : ''} ${chatHistory.mstramell.length === 0 ? 'justify-center h-full' : 'items-center'}`}>
            <h1 className={`text-4xl italic text-[#dcd0b3] ${chatHistory.mstramell.length === 0 ? 'mb-0' : 'mt-12 mb-4'}`}>Hello, stranger...</h1>

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
        <div className="absolute bottom-10 left-0 right-0 flex justify-start pl-4 pr-4 md:justify-center md:pl-0 md:pr-0 z-20">
          <div className="w-[85%] md:w-full max-w-3xl flex items-end gap-3 transition-all duration-300 md:px-8">


            {/* Desktop "Plus" (hidden on mobile now that we have the toggle, or we can keep it part of the group) */}
            <div className="hidden md:block">
              <button className="p-3 rounded-full hover:bg-[var(--accent-color)] hover:text-white transition-all text-[var(--text-color)]/60 hover:shadow-lg glass-panel">
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <div
              className="flex-1 glass-panel rounded-2xl p-2 shadow-2xl flex items-center focus-within:ring-1 focus-within:ring-[var(--accent-color)]/50 transition-all duration-300 relative"
              style={{ backgroundColor: 'var(--input-bg)' }}
            >
              {/* Mobile Menu Button - Inside Input Bar */}
              <div className="relative md:hidden">
                <button
                  onClick={() => setShowMobileInputs(!showMobileInputs)}
                  className="p-2 rounded-lg hover:bg-[var(--highlight-color)] text-[var(--text-color)]/70 transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>

                {/* Pull-up Menu */}
                {showMobileInputs && (
                  <div className="absolute bottom-full left-0 mb-2 bg-[var(--panel-color)] border border-[var(--border-color)] rounded-lg shadow-xl p-2 min-w-[180px] backdrop-blur-xl">
                    <button
                      onClick={triggerGenerate}
                      className="w-full flex items-center gap-3 p-3 hover:bg-[var(--highlight-color)] rounded-lg text-[var(--text-color)]/80 hover:text-[var(--accent-color)] transition-all"
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-sm">Generate Image</span>
                    </button>
                    <button
                      className="w-full flex items-center gap-3 p-3 hover:bg-[var(--highlight-color)] rounded-lg text-[var(--text-color)]/80 hover:text-[var(--accent-color)] transition-all"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="text-sm">Upload File</span>
                    </button>
                  </div>
                )}
              </div>

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
                className="hidden md:block p-3.5 mr-1 rounded-xl hover:bg-[var(--highlight-color)] text-[var(--text-color)]/50 hover:text-[var(--accent-color)] transition-all">
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
