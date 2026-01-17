"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MoreVertical, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { SCARLET_PRIME } from '../haven/blind_date/data';

// Mock data replaced by clean slate
const MOCK_CHARACTERS: any[] = [];

interface BlindDateDashboardProps {
    isActive: boolean;
}

export default function BlindDateDashboard({ isActive }: BlindDateDashboardProps) {
    const [isVerified, setIsVerified] = useState(false);
    const [characters, setCharacters] = useState([SCARLET_PRIME]);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initial Audio Setup
    useEffect(() => {
        if (!isActive) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            return;
        }

        if (!audioRef.current) {
            audioRef.current = new Audio('/media/sounds/masked_ball_edit.wav');
            audioRef.current.loop = true;
        }

        if (isVerified) {
            audioRef.current.play().catch(e => console.log("Audio autoplay blocked", e));
        }
    }, [isActive, isVerified]);

    // Load Characters
    useEffect(() => {
        if (!isActive) return;
        const saved = localStorage.getItem('haven_blind_dates');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Ensure Scarlet is always first, prevent duplicates if she was accidentally saved
                const filtered = parsed.filter((c: any) => c.id !== 'scarlet-prime');
                setCharacters([SCARLET_PRIME, ...filtered]);
            } catch (e) {
                console.error("Failed to load connections", e);
                setCharacters([SCARLET_PRIME]);
            }
        }
    }, [isActive]);

    // Click outside listener for dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleDelete = (id: string) => {
        // Remove from state
        const updated = characters.filter(c => c.id !== id);
        setCharacters(updated);

        // Remove from LocalStorage
        const saved = localStorage.getItem('haven_blind_dates');
        if (saved) {
            const parsed = JSON.parse(saved);
            const newSaved = parsed.filter((c: any) => c.id !== id);
            localStorage.setItem('haven_blind_dates', JSON.stringify(newSaved));
        }
        setOpenDropdownId(null);
    };

    const enterTheRitual = () => {
        setIsVerified(true);
        if (audioRef.current) {
            audioRef.current.volume = 0.5;
            audioRef.current.play().catch(e => console.log("Audio autoplay blocked", e));
        }
    };

    if (!isActive) return null;

    if (!isVerified) {
        return (
            <div className="absolute inset-x-0 bottom-0 top-0 bg-black flex items-center justify-center overflow-hidden cursor-pointer z-40" onClick={enterTheRitual}>
                {/* Dark Cinematic Background */}
                <div className="absolute inset-0 bg-[url('/media/design/door_locked.png')] bg-cover bg-center opacity-60 hover:opacity-100 transition-opacity duration-1000 scale-105" />
                <div className="absolute inset-0 bg-black/40 hover:bg-transparent transition-colors duration-1000" />

                <div className="relative z-10 text-center space-y-4 animate-pulse">
                    <h1 className="text-4xl md:text-6xl font-serif text-[#d4af37] tracking-widest drop-shadow-lg" style={{ fontFamily: 'Times New Roman, serif' }}>
                        FIDELIO
                    </h1>
                    <p className="text-neutral-500 text-xs tracking-[0.5em] uppercase">Click to Enter</p>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-x-0 bottom-0 top-0 bg-[#050505] text-[#d4af37] font-serif overflow-y-auto z-40">
            {/* Venetian Hall Background */}
            <div className="fixed inset-0 bg-[url('/media/design/venetian_hall_bg.png')] bg-cover bg-center opacity-30 pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] pointer-events-none" />

            <div className="relative z-10 p-4 pt-20 md:p-8 md:pt-24">
                {/* Header */}
                <header className="flex justify-between items-center mb-16 max-w-7xl mx-auto border-b border-[#d4af37]/20 pb-6">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-[#d4af37] drop-shadow-md" style={{ fontFamily: 'Times New Roman, serif' }}>
                            The Circle
                        </h1>
                        <p className="text-[#8a1c1c] mt-2 italic tracking-wide">Choose your partner for the ritual.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-[#1a0505] px-6 py-2 rounded-full border border-[#d4af37]/30 flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                            <span className="text-xl">🎭</span>
                            <span className="font-mono font-bold text-[#d4af37]">∞</span>
                        </div>
                    </div>
                </header>

                {/* Grid */}
                <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">

                    {/* Create New (The Empty Mask) */}
                    <Link href="/haven/blind_date/create" className="group relative aspect-[3/4] rounded-sm border border-[#d4af37]/30 hover:border-[#d4af37] transition-all duration-500 flex flex-col items-center justify-center cursor-pointer bg-[#0a0202]/80 hover:bg-[#1a0505]">
                        <div className="w-24 h-32 opacity-20 group-hover:opacity-100 transition-opacity duration-500 bg-[url('/media/design/venetian_mask_gold.png')] bg-contain bg-center bg-no-repeat filter grayscale group-hover:grayscale-0" />
                        <span className="mt-6 font-serif text-[#d4af37]/50 group-hover:text-[#d4af37] tracking-widest text-sm uppercase">Invite New Soul</span>
                    </Link>

                    {/* Character Masks */}
                    {characters.map((char) => (
                        <motion.div
                            key={char.id}
                            whileHover={{ scale: 1.02 }}
                            className="relative aspect-[3/4] rounded-sm overflow-hidden group border border-[#d4af37]/20 bg-[#0a0202] shadow-2xl"
                        >
                            {/* The Mask (Uses Character Image or Generic Mask if missing) */}
                            <div className="absolute inset-0 bg-black z-0" />

                            {/* Visual Layer: Default is Mask, Hover reveals Face */}
                            <div className="absolute inset-0 transition-all duration-700 ease-in-out group-hover:opacity-100 opacity-40">
                                <img
                                    src={char.image || '/media/design/venetian_mask_gold.png'}
                                    alt={char.name}
                                    className="w-full h-full object-cover filter sepia-[.5] group-hover:sepia-0"
                                />
                            </div>

                            {/* Gold Mask Overlay (Fades out on hover) */}
                            <div className="absolute inset-0 bg-[url('/media/design/venetian_mask_gold.png')] bg-cover bg-center opacity-80 group-hover:opacity-0 transition-opacity duration-700 pointer-events-none mix-blend-overlay" />

                            {/* Content Overlay */}
                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#1a0000] via-[#1a0000]/90 to-transparent z-10 flex flex-col gap-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                <div className="flex justify-between items-start border-b border-[#d4af37]/30 pb-3">
                                    <div>
                                        <h2 className="text-3xl font-serif text-[#d4af37]">
                                            {char.name}
                                        </h2>
                                        <p className="text-xs text-[#8a1c1c] uppercase tracking-widest">{char.tagline}</p>
                                    </div>
                                    <div className="relative" ref={openDropdownId === char.id ? dropdownRef : null}>
                                        <button
                                            className="p-2 hover:bg-[#d4af37]/10 rounded-full transition-colors text-[#d4af37]"
                                            onClick={() => setOpenDropdownId(openDropdownId === char.id ? null : char.id)}
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                        {openDropdownId === char.id && (
                                            <div className="absolute right-0 mt-2 w-48 bg-[#1a0505] border border-[#d4af37]/50 shadow-[0_0_20px_rgba(212,175,55,0.2)] z-20">
                                                <button
                                                    onClick={() => handleDelete(char.id)}
                                                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-[#8a1c1c] hover:bg-[#2a0505] hover:text-red-500 transition-colors font-serif uppercase tracking-wider"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Burn Invitation
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Link href={`/haven/blind_date/chat/${char.id}`} className="mt-2 w-full py-3 border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-all duration-300 font-serif uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                                    Approaching...
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </main>
            </div>
        </div>
    );
}
