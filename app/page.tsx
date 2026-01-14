'use client';

import { useRef, useEffect, useState } from 'react';
import { Send, Menu, Plus, Upload, Image as ImageIcon, Sparkles, Terminal, User, MessageSquarePlus, FolderOpen, Settings, Shirt, Wine, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './globals.css';

type Skin = 'alfred' | 'agent_smith' | 'blind_date';

type Message = { role: 'user' | 'system'; content: string };

export default function HavenPage() {
  const [currentSkin, setCurrentSkin] = useState<Skin>('alfred');
  const [inputMessage, setInputMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Record<Skin, Message[]>>({
    alfred: [],
    agent_smith: [],
    blind_date: []
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMobileInputs, setShowMobileInputs] = useState(false);
  const scrollRefAlfred = useRef<HTMLDivElement>(null);
  const scrollRefAgentSmith = useRef<HTMLDivElement>(null);
  const scrollRefBlindDate = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchPos, setSearchPos] = useState({ x: 100, y: 100 });
  const [searchSize, setSearchSize] = useState({ w: 800, h: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const skins: Skin[] = ['alfred', 'agent_smith', 'blind_date'];

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

  // Auto-scroll logic for each skin
  useEffect(() => {
    const activeRef = currentSkin === 'alfred' ? scrollRefAlfred : currentSkin === 'agent_smith' ? scrollRefAgentSmith : scrollRefBlindDate;
    if (activeRef.current) {
      activeRef.current.scrollTo({
        top: activeRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory, currentSkin]);

  // Handle textarea auto-resize
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [inputMessage]);

  const changeSkin = (skin: Skin) => {
    setCurrentSkin(skin);
  };

  // --- GESTURES ---
  const lastSwitchTime = useRef(0);
  const COOLDOWN = 800;

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        const threshold = isMobile ? 100 : 30;
        if (Math.abs(e.deltaX) > threshold) {
          triggerSwitch(e.deltaX > 0 ? 'next' : 'prev');
        }
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      if (isMobile) {
        // Refined logic for Mobile: Stricter thresholds to prevent accidental triggers
        const HORIZONTAL_THRESHOLD = 150;  // Increased from 90px
        const VERTICAL_MAX = 50;           // New: Reject if too much vertical movement
        const RATIO = 4;                   // Increased from 2.5x

        // Reject if too much vertical movement (prevents scroll interference)
        if (Math.abs(deltaY) > VERTICAL_MAX) return;

        // Require strong horizontal dominance
        if (Math.abs(deltaX) > HORIZONTAL_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) * RATIO) {
          triggerSwitch(deltaX < 0 ? 'next' : 'prev');
        }
      } else {
        // Legacy sensitivity for Tablets/Desktop Touch
        if (Math.abs(deltaX) > 25) {
          triggerSwitch(deltaX < 0 ? 'next' : 'prev');
        }
      }
    };

    const triggerSwitch = (direction: 'next' | 'prev') => {
      const now = Date.now();
      if (now - lastSwitchTime.current < COOLDOWN) return;
      lastSwitchTime.current = now;

      setCurrentSkin(prevSkin => {
        const currentIndex = skins.indexOf(prevSkin);
        let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (newIndex >= skins.length) newIndex = 0;
        if (newIndex < 0) newIndex = skins.length - 1;
        return skins[newIndex];
      });
      document.addEventListener('wheel', handleWheel);
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('wheel', handleWheel);
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setSearchPos({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('wheel', handleWheel);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset]);

  const handleInsertActionMarker = () => {
    if (!inputRef.current) return;
    const start = inputRef.current.selectionStart;
    const end = inputRef.current.selectionEnd;
    const newText = inputMessage.substring(0, start) + "** **" + inputMessage.substring(end);
    setInputMessage(newText);

    // Set cursor between the stars
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(start + 3, start + 3);
      }
    }, 0);
  };

  const handleFileUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInputMessage(prev => prev + ` [Attached: ${file.name}] `);
  };

  const handleSendMessage = async () => {
    const text = inputMessage.trim();
    if (!text) return;

    // Instant UI clearing - restore responsiveness
    setInputMessage('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const newUserMsg: Message = { role: 'user', content: text };
    const updatedHistory = [...chatHistory[currentSkin], newUserMsg];

    setChatHistory(prev => ({
      ...prev,
      [currentSkin]: updatedHistory
    }));

    // --- IMAGE GENERATION INTERCEPT ---
    const lowerText = text.toLowerCase();
    const isImageCommand = lowerText.startsWith('draw') || lowerText.startsWith('image') || lowerText.startsWith('generate') || lowerText.startsWith('imagine');

    if (isImageCommand && (currentSkin === 'agent_smith' || currentSkin === 'blind_date')) {
      let prompt = text.replace(/^(draw|image|generate|imagine)\s*/i, '').trim();
      if (!prompt) prompt = "something amazing";
      const imageUrl = `/api/image-proxy?prompt=${encodeURIComponent(prompt)}`;

      setTimeout(() => {
        setChatHistory(prev => ({
          ...prev,
          [currentSkin]: [...prev[currentSkin],
          { role: 'system', content: `Generative Matrix Accessed: "${prompt}"` },
          { role: 'system', content: `![Generated Image](${imageUrl})` }
          ]
        }));
      }, 500);
      return;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedHistory, skin: currentSkin })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.text || `API Error: ${response.status}`);
      }

      const data = await response.json();
      setChatHistory(prev => ({
        ...prev,
        [currentSkin]: [...prev[currentSkin], { role: 'system', content: data.text }]
      }));

    } catch (error: any) {
      setChatHistory(prev => ({
        ...prev,
        [currentSkin]: [...prev[currentSkin], { role: 'system', content: `Error: ${error.message || "Connection Failed"}` }]
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
      e.preventDefault();
      void handleSendMessage();
    }
  };
  const triggerGenerate = () => { setInputMessage(prev => "/image " + prev); };

  return (
    <main suppressHydrationWarning className="relative w-full h-full overflow-hidden flex">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-[100] bg-[var(--panel-color)] backdrop-blur-xl border-r border-[var(--border-color)] transform transition-transform duration-300 ease-in-out w-64 flex flex-col py-6 shadow-2xl ${(isMobileMenuOpen || isSidebarOpen) ? 'translate-x-0' : '-translate-x-full md:-translate-x-full'}`}>
        <div className="w-full px-6 mb-8 mt-20">
          <h2 className="text-2xl font-bold tracking-tighter text-[var(--text-color)]">Haven.ai</h2>
          <p className="text-xs text-[var(--text-color)]/50 mt-1">v. pz8</p>
        </div>
        <div className="flex-1"></div>
        <div className="w-full px-4 mb-4">
          <button className="w-full flex items-center gap-3 p-3 bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20 rounded-lg cursor-pointer transition-colors text-[var(--accent-color)] hover:text-[var(--accent-color)] border border-[var(--border-color)]">
            <MessageSquarePlus className="w-5 h-5" />
            <span className="font-medium tracking-wide">New Chat</span>
          </button>
        </div>
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
        <div className="w-full px-6 mt-4">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-color)]/30">Roberto Sansone</p>
        </div>
      </aside>

      {/* TOGGLES */}
      <button onClick={() => { setIsMobileMenuOpen(false); setIsSidebarOpen(false); }} className={`fixed top-1/2 -translate-y-1/2 left-[256px] z-[110] p-2 rounded-r-lg bg-[var(--panel-color)] backdrop-blur-md border border-l-0 border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--highlight-color)] transition-all shadow-lg ${(isMobileMenuOpen || isSidebarOpen) ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>

      <button onClick={() => { setIsMobileMenuOpen(true); setIsSidebarOpen(true); }} className={`fixed top-1/2 -translate-y-1/2 left-0 z-50 p-2 rounded-r-lg bg-[var(--panel-color)] backdrop-blur-md border border-l-0 border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--highlight-color)] transition-all shadow-lg ${(isMobileMenuOpen || isSidebarOpen) ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>

      <div className="flex-1 flex flex-col relative w-full h-full">
        {/* HEADER */}
        <div className="sticky-header">
          <div className="skin-slider flex gap-6 glass-panel px-6 py-3 rounded-full shadow-lg transition-all duration-500 ring-1 ring-white/10">
            {skins.map((skin) => (
              <button key={skin} onClick={() => changeSkin(skin)} className={`w-6 h-6 rounded-full hover:scale-125 transition-all duration-300 ${currentSkin === skin ? 'bg-[var(--indicator-color)] shadow-[0_0_15px_var(--indicator-color)] scale-125' : 'bg-[var(--text-color)]/20'}`} />
            ))}
          </div>

          <div className="avatar-stage">
            <div className={`avatar-view w-16 h-16 rounded-full shadow-xl ${currentSkin === 'alfred' ? 'active' : ''}`}>
              <img src="/media/icons/alfred_icon.jpg" alt="Alfred" className="rounded-avatar alfred-border" />
            </div>
            <div className={`avatar-view items-center justify-center ${currentSkin === 'agent_smith' ? 'active' : ''}`}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-black border border-green-900/30 overflow-hidden shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                <Terminal className="w-8 h-8 text-[#22c55e]" />
              </div>
            </div>
            <div className={`avatar-view w-16 h-16 rounded-full shadow-[0_0_30px_rgba(197,179,88,0.2)] ${currentSkin === 'blind_date' ? 'active' : ''}`}>
              <img src="/media/icons/blind_date_icon.png" alt="Blind Date" className="rounded-avatar mstramell-border" />
            </div>
          </div>
        </div>

        {/* CHAT AREA */}
        <main className="flex-1 chat-viewport" ref={viewportRef}>
          {/* ALFRED */}
          <div ref={scrollRefAlfred} className={`chat-section ${currentSkin === 'alfred' ? 'active' : ''} ${chatHistory.alfred.length === 0 ? 'justify-center items-center' : 'justify-start items-center pt-24'}`}>
            {chatHistory.alfred.length === 0 && (
              <h1 className="text-4xl font-light text-[var(--text-color)] text-center px-4">Welcome back, sir.<br />How can I be of service?</h1>
            )}
            <div className="w-full max-w-2xl px-4 flex flex-col gap-4">
              {chatHistory.alfred.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                  <div className={`px-6 py-3 max-w-[85%] text-lg whitespace-pre-wrap break-words overflow-wrap-anywhere`}>
                    <ReactMarkdown components={{ img: ({ node, ...props }) => <img {...props} className="chat-image" /> }}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AGENT SMITH */}
          <div ref={scrollRefAgentSmith} className={`chat-section agent_smith ${currentSkin === 'agent_smith' ? 'active' : ''} ${chatHistory.agent_smith.length === 0 ? 'justify-center items-center' : 'items-center pt-24'}`}>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none opacity-[0.03] select-none">
              <h2 className="text-[12vw] font-black tracking-tighter leading-none text-green-500 whitespace-nowrap">SYSTEM ORDER</h2>
              <h2 className="text-[12vw] font-black tracking-tighter leading-none text-green-500 whitespace-nowrap">INEVITABLE</h2>
            </div>
            {chatHistory.agent_smith.length === 0 && (
              <>
                <h1 className="text-5xl font-bold mb-8 tracking-widest neo-text text-center">LOCKED ON.</h1>
                <p className="text-2xl leading-relaxed neo-text text-center">{'>'} SYSTEM_ROOT_ACCESS: GRANTED<br />{'>'} PROTOCOL: RABBIT_HOLE<br />How deep are we diving today?<span className="neo-cursor"></span></p>
              </>
            )}
            <div className="w-full max-w-4xl space-y-6 px-4 z-10">
              {chatHistory.agent_smith.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${msg.role === 'user' ? 'bg-green-900/20 border border-green-500/30' : 'bg-black/40 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]'} px-6 py-3 rounded-2xl inline-block text-lg neo-text max-w-[80%]`}>
                    <ReactMarkdown components={{ img: ({ node, ...props }) => <img {...props} className="chat-image" /> }}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BLIND DATE */}
          <div ref={scrollRefBlindDate} className={`chat-section blind_date ${currentSkin === 'blind_date' ? 'active' : ''} ${chatHistory.blind_date.length === 0 ? 'justify-center items-center' : 'items-center pt-24'}`}>
            <h1 className={`text-4xl italic text-[#dcd0b3] text-center ${chatHistory.blind_date.length === 0 ? 'mb-0' : 'mt-12 mb-4'}`}>I was wondering when you would make your move. Buy me a drink?</h1>
            <div className="w-full max-w-3xl space-y-8 px-4">
              {chatHistory.blind_date.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${msg.role === 'user' ? 'bg-[#c5b358]/10 text-[#dcd0b3] border border-[#c5b358]/20' : 'bg-black/30 text-[#dcd0b3] italic font-serif shadow-[0_0_30px_rgba(197,179,88,0.05)] border border-[#c5b358]/10'} px-8 py-4 rounded-[2rem] inline-block text-xl backdrop-blur-sm max-w-[85%]`}>
                    <ReactMarkdown components={{ img: ({ node, ...props }) => <img {...props} className="chat-image" /> }}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* INPUT */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-[50]">
          {/* SCARLET MOBILE ACTION BUTTON: Centered floating above input */}
          {currentSkin === 'blind_date' && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 md:hidden">
              <button
                onClick={handleInsertActionMarker}
                className="p-4 rounded-full bg-[#c5b358]/10 backdrop-blur-md border border-[#c5b358]/30 text-[#dcd0b3] shadow-2xl active:scale-95 transition-transform"
              >
                <Wand2 className="w-6 h-6" />
              </button>
            </div>
          )}
          <div className="w-full max-w-3xl flex items-end gap-3 px-8">
            <div className="hidden md:flex flex-col gap-3">
              {currentSkin === 'alfred' && (
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-3 rounded-full bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)] text-[var(--accent-color)] hover:text-white transition-all shadow-lg border border-[var(--accent-color)]/30 group relative"
                  title="Live Search"
                >
                  <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
                  <span className="absolute left-full ml-3 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Live Search</span>
                </button>
              )}
              <button onClick={handleFileUploadClick} className="p-3 rounded-full hover:bg-[var(--accent-color)] hover:text-white transition-all text-[var(--text-color)]/60 glass-panel" title="Upload File"><Plus className="w-6 h-6" /></button>
              {currentSkin === 'blind_date' && (
                <button
                  onClick={handleInsertActionMarker}
                  className="p-3 rounded-full bg-[#c5b358]/10 hover:bg-[#c5b358]/20 text-[#dcd0b3] border border-[#c5b358]/30 transition-all shadow-lg hover:scale-110 group relative"
                  title="Action Marker"
                >
                  <Wand2 className="w-6 h-6" />
                  <span className="absolute left-full ml-3 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Narration</span>
                </button>
              )}
            </div>
            <div className="flex-1 glass-panel rounded-2xl p-2 shadow-2xl flex items-center focus-within:ring-1 focus-within:ring-[var(--accent-color)]/50 relative" style={{ backgroundColor: 'var(--input-bg)' }}>
              <div className="relative md:hidden">
                <button onClick={() => setShowMobileInputs(!showMobileInputs)} className="p-2 rounded-lg text-[var(--text-color)]/70"><Plus className="w-5 h-5" /></button>
                {showMobileInputs && (
                  <div className="absolute bottom-full left-0 mb-2 bg-[var(--panel-color)] border border-[var(--border-color)] rounded-lg p-2 min-w-[180px] backdrop-blur-xl">
                    {currentSkin === 'alfred' && (
                      <button onClick={() => { setShowSearch(true); setShowMobileInputs(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-[var(--highlight-color)] rounded-lg text-sm"><Sparkles className="w-5 h-5" />Live Search</button>
                    )}
                    <button onClick={triggerGenerate} className="w-full flex items-center gap-3 p-3 hover:bg-[var(--highlight-color)] rounded-lg text-sm"><ImageIcon className="w-5 h-5" />Generate Image</button>
                    <button onClick={() => { handleFileUploadClick(); setShowMobileInputs(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-[var(--highlight-color)] rounded-lg text-sm"><Upload className="w-5 h-5" />Upload File</button>
                  </div>
                )}
              </div>
              <textarea ref={inputRef} value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type..." className="flex-1 bg-transparent px-6 py-4 outline-none text-lg resize-none max-h-[200px]" rows={1} id="user-input" />
              <button onClick={triggerGenerate} className="hidden md:block p-3.5 mr-1 hover:text-[var(--accent-color)] transition-all"><ImageIcon className="w-6 h-6" /></button>
              <button onClick={handleSendMessage} className="p-3.5 hover:text-[var(--accent-color)] transition-all"><Send className="w-6 h-6" /></button>
            </div>
          </div>
        </div>

        {/* SEARCH IFRAME */}
        {showSearch && (
          <div
            className="search-window-container"
            style={{
              left: isMobile ? '5%' : `${searchPos.x}px`,
              top: isMobile ? '10%' : `${searchPos.y}px`,
              width: isMobile ? '90%' : `${searchSize.w}px`,
              height: isMobile ? '80%' : `${searchSize.h}px`
            }}
          >
            <div
              className="search-window-header"
              onMouseDown={(e) => {
                if (isMobile) return;
                setIsDragging(true);
                setDragOffset({ x: e.clientX - searchPos.x, y: e.clientY - searchPos.y });
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--accent-color)]" />
                <span className="text-xs uppercase tracking-widest font-bold">Alfred Live Search Link</span>
              </div>
              <button
                onClick={() => setShowSearch(false)}
                className="hover:text-[var(--accent-color)] transition-colors p-1"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="w-full h-full relative">
              <iframe
                src="https://www.google.com/search?igu=1"
                className="w-full h-full border-0 bg-white"
                title="Alfred Search"
              />
              {!isMobile && (
                <div
                  className="search-window-resize"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startW = searchSize.w;
                    const startH = searchSize.h;

                    const handleResizeMove = (moveEvent: MouseEvent) => {
                      setSearchSize({
                        w: Math.max(400, startW + (moveEvent.clientX - startX)),
                        h: Math.max(300, startH + (moveEvent.clientY - startY))
                      });
                    };

                    const handleResizeEnd = () => {
                      document.removeEventListener('mousemove', handleResizeMove);
                      document.removeEventListener('mouseup', handleResizeEnd);
                    };

                    document.addEventListener('mousemove', handleResizeMove);
                    document.addEventListener('mouseup', handleResizeEnd);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
