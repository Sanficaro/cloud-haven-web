"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Sparkles, User, Palette, Globe, MessageCircle, Eye, Heart, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// -- Types --
type CreationStep = 'visuals' | 'negotiation' | 'reveal';

interface VisualState {
    style: 'realistic' | 'anime';
    ethnicity: string;
    bodyType: string;
    hairColor: string;
    hairStyle: string;
    eyeColor: string;
    skinTone: string;
    relationship: string;
    name: string;
}

interface Message {
    role: 'architect' | 'user';
    content: string;
}

// -- Mock Data for Visual Options --
const ETHNICITIES = ['European', 'Asian', 'Latina', 'African', 'Middle Eastern', 'South Asian'];
const BODY_TYPES = [
    { id: 'slim', label: 'Slim', desc: 'Petite & Athletic' },
    { id: 'curvy', label: 'Curvy', desc: 'Hourglass & Voluptuous' },
    { id: 'muscular', label: 'Muscular', desc: 'Fit & Toned' },
    { id: 'bbw', label: 'Voluptuous', desc: 'Soft & Thick' },
];
const HAIR_COLORS = [
    { label: 'Blonde', hex: '#FAD02C' },
    { label: 'Brunette', hex: '#4B3621' },
    { label: 'Black', hex: '#000000' },
    { label: 'Red', hex: '#880808' },
    { label: 'Pink', hex: '#FFC0CB' },
    { label: 'White', hex: '#F0F0F0' },
];
const HAIR_STYLES = [
    'Long Straight', 'Bob Cut', 'Pixie', 'Curly', 'Wavy', 'Ponytail', 'Messy Bun', 'Braids'
];
const EYE_COLORS = [
    { label: 'Blue', hex: '#3B82F6' },
    { label: 'Green', hex: '#22C55E' },
    { label: 'Brown', hex: '#5D4037' },
    { label: 'Hazel', hex: '#ADFF2F' },
    { label: 'Gray', hex: '#9CA3AF' },
    { label: 'Red', hex: '#EF4444' } // Anime style
];
const SKIN_TONES = [
    { label: 'Pale', hex: '#F3E5DC' },
    { label: 'Fair', hex: '#FFDFC4' },
    { label: 'Medium', hex: '#E0AC69' },
    { label: 'Olive', hex: '#C68642' },
    { label: 'Brown', hex: '#8D5524' },
    { label: 'Dark', hex: '#3B2219' },
];
const RELATIONSHIPS = ['Girlfriend', 'Friend', 'Mentor', 'Enemy', 'Step-Sister', 'Stranger'];


export default function BlindDateCreate() {
    const router = useRouter();
    const [step, setStep] = useState<CreationStep>('visuals');

    // Creation State
    const [visuals, setVisuals] = useState<VisualState>({
        style: 'realistic',
        ethnicity: 'European',
        bodyType: 'slim',
        hairColor: 'Brunette',
        hairStyle: 'Long Straight',
        eyeColor: 'Green',
        skinTone: 'Fair',
        relationship: 'Girlfriend',
        name: ''
    });

    // Reveal State
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Negotiation State
    const [messages, setMessages] = useState<Message[]>([]);
    const [chips, setChips] = useState<string[]>([]);
    const [turn, setTurn] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [inputText, setInputText] = useState("");

    // -- Generators --
    const compressImage = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(blob);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max size 512px
                const MAX_SIZE = 512;
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

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("No canvas context"));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                // Compress to JPEG 80% quality
                const base64 = canvas.toDataURL('image/jpeg', 0.8);

                URL.revokeObjectURL(url);
                resolve(base64);
            };

            img.onerror = reject;
            img.src = url;
        });
    };

    const generatePortrait = async () => {
        setIsGenerating(true);
        // Construct detailed prompt
        const lastMsg = messages[messages.length - 1]?.content || "";
        const prompt = `A ${visuals.style} portrait of a ${visuals.ethnicity} woman named ${visuals.name}, ${visuals.bodyType} body, ${visuals.skinTone} skin, ${visuals.hairStyle} ${visuals.hairColor} hair, ${visuals.eyeColor} eyes. She is a ${visuals.relationship}. Context: ${lastMsg.slice(0, 100)}. High quality, 8k, masterpiece, soft lighting.`;

        try {
            const res = await fetch('/api/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    skin: 'blind_date'
                })
            });

            if (res.ok) {
                const blob = await res.blob();
                const compressedBase64 = await compressImage(blob);
                setGeneratedImage(compressedBase64);
            }
        } catch (e) {
            console.error("Image Gen Failed", e);
        } finally {
            setIsGenerating(false);
        }
    };

    // Trigger on Reveal
    // Trigger on Reveal - ONLY once when step changes
    useEffect(() => {
        if (step === 'reveal' && !generatedImage && !isGenerating) {
            generatePortrait();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    const handleSave = () => {
        const newChar = {
            id: Date.now().toString(),
            name: visuals.name,
            tagline: messages[messages.length - 1]?.content.slice(0, 50) + "...",
            image: generatedImage,
            level: 1,
            isOnline: true,
            visuals: visuals,
            bio: messages[messages.length - 1]?.content // The synthesized bio
        };

        const existing = JSON.parse(localStorage.getItem('haven_blind_dates') || '[]');
        localStorage.setItem('haven_blind_dates', JSON.stringify([...existing, newChar]));

        router.push('/haven?skin=blind_date');
    };


    // -- Handlers --
    const handleNext = () => {
        // Validate Name
        if (step === 'visuals' && !visuals.name.trim()) {
            alert("Please give her a name.");
            return;
        }

        if (step === 'visuals') {
            setStep('negotiation');
            // Adding a small delay to ensure render transition before fetching
            setTimeout(() => triggerArchitect([], 1), 100);
        }
    };

    const triggerArchitect = async (currentHistory: Message[], currentTurn: number) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/blind_date/negotiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: currentHistory,
                    visuals: visuals,
                    turn: currentTurn
                })
            });

            if (!res.ok) throw new Error("Architect connection error");

            const data = await res.json();

            // Add Architect's response
            setMessages(prev => [...prev, { role: 'architect', content: data.message }]);
            setChips(data.chips || []);

        } catch (error) {
            console.error("Architect Error", error);
            setMessages(prev => [...prev, { role: 'architect', content: "I'm having trouble connecting to the neural fabric. Let's try that again. Who is she?" }]);
            setChips(["Try Again"]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;

        const newMsg: Message = { role: 'user', content: text };
        const newHistory = [...messages, newMsg];

        setMessages(prev => [...prev, newMsg]);
        setIsLoading(true);
        setChips([]);
        setInputText("");

        if (turn >= 4) {
            setStep('reveal');
            setIsLoading(false);
        } else {
            const nextTurn = turn + 1;
            setTurn(nextTurn);
            triggerArchitect(newHistory, nextTurn);
        }
    };

    return (
        <div className="h-screen overflow-y-auto bg-neutral-950 text-white flex flex-col font-sans selection:bg-pink-500/30 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">

            {/* Header / Nav */}
            <header className="px-6 py-6 border-b border-neutral-800 flex items-center justify-between">
                <Link href="/haven?skin=blind_date" className="text-neutral-400 hover:text-white flex items-center gap-2 transition-colors">
                    ← Cancel
                </Link>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold tracking-tight">Design Your Connection</h1>
                    <div className="flex gap-2 mt-1">
                        <div className={`h-1 w-8 rounded-full transition-colors ${step === 'visuals' ? 'bg-pink-500' : 'bg-neutral-800'}`} />
                        <div className={`h-1 w-8 rounded-full transition-colors ${step === 'negotiation' ? 'bg-pink-500' : 'bg-neutral-800'}`} />
                        <div className={`h-1 w-8 rounded-full transition-colors ${step === 'reveal' ? 'bg-pink-500' : 'bg-neutral-800'}`} />
                    </div>
                </div>
                <div className="w-16" /> {/* Spacer */}
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col items-center justify-start pt-10 p-6 w-full max-w-4xl mx-auto pb-32">
                <AnimatePresence mode="wait">

                    {/* STEP 1: VISUAL FOUNDATION */}
                    {step === 'visuals' && (
                        <motion.div
                            key="visuals"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full flex flex-col gap-12"
                        >
                            {/* Section 0: Name */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                                    <User className="w-4 h-4" /> Name
                                </label>
                                <input
                                    type="text"
                                    value={visuals.name}
                                    onChange={(e) => setVisuals({ ...visuals, name: e.target.value })}
                                    placeholder="Give her a name..."
                                    className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-6 text-xl font-bold placeholder:text-neutral-600 focus:outline-none focus:border-pink-500 focus:bg-pink-500/10 transition-all"
                                />
                            </div>

                            {/* Section 1: Art Style */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                                    <Palette className="w-4 h-4" /> Art Style
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {['realistic', 'anime'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setVisuals({ ...visuals, style: s as any })}
                                            className={`p-6 rounded-xl border-2 transition-all capitalize font-bold text-lg ${visuals.style === s
                                                ? 'border-pink-500 bg-pink-500/10 text-white'
                                                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section 2: Ethnicity */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                                    <Globe className="w-4 h-4" /> Ethnicity
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {ETHNICITIES.map((eth) => (
                                        <button
                                            key={eth}
                                            onClick={() => setVisuals({ ...visuals, ethnicity: eth })}
                                            className={`px-6 py-3 rounded-full border transition-all font-medium ${visuals.ethnicity === eth
                                                ? 'border-pink-500 bg-pink-500 text-white'
                                                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600'
                                                }`}
                                        >
                                            {eth}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section 3: Body Type */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                                    <User className="w-4 h-4" /> Body Type
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {BODY_TYPES.map((bt) => (
                                        <button
                                            key={bt.id}
                                            onClick={() => setVisuals({ ...visuals, bodyType: bt.id })}
                                            className={`p-4 rounded-xl border-2 transition-all text-left ${visuals.bodyType === bt.id
                                                ? 'border-pink-500 bg-pink-500/10'
                                                : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
                                                }`}
                                        >
                                            <div className={`font-bold ${visuals.bodyType === bt.id ? 'text-pink-400' : 'text-neutral-200'}`}>
                                                {bt.label}
                                            </div>
                                            <div className="text-xs text-neutral-500 mt-1">{bt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section 4: Eye Color */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                                    <Eye className="w-4 h-4" /> Eye Color
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {EYE_COLORS.map((eye) => (
                                        <button
                                            key={eye.label} // Using Label as ID
                                            onClick={() => setVisuals({ ...visuals, eyeColor: eye.label })}
                                            className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${visuals.eyeColor === eye.label
                                                ? 'border-pink-500 bg-pink-500/10 text-white'
                                                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600'
                                                }`}
                                        >
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: eye.hex }} />
                                            {eye.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section 5: Hair Color */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" /> Hair Color
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {HAIR_COLORS.map((hc) => (
                                        <button
                                            key={hc.label} // Using Label as ID for simplicity
                                            onClick={() => setVisuals({ ...visuals, hairColor: hc.label })}
                                            className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${visuals.hairColor === hc.label
                                                ? 'border-pink-500 bg-pink-500/10 text-white'
                                                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600'
                                                }`}
                                        >
                                            <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: hc.hex }} />
                                            {hc.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section 6: Hair Style */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" /> Hair Style
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {HAIR_STYLES.map((hs) => (
                                        <button
                                            key={hs}
                                            onClick={() => setVisuals({ ...visuals, hairStyle: hs })}
                                            className={`px-6 py-3 rounded-full border transition-all font-medium ${visuals.hairStyle === hs
                                                ? 'border-pink-500 bg-pink-500 text-white'
                                                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600'
                                                }`}
                                        >
                                            {hs}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section 7: Skin Tone */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                                    <User className="w-4 h-4" /> Skin Tone
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {SKIN_TONES.map((st) => (
                                        <button
                                            key={st.label}
                                            onClick={() => setVisuals({ ...visuals, skinTone: st.label })}
                                            className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${visuals.skinTone === st.label
                                                ? 'border-pink-500 bg-pink-500/10 text-white'
                                                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600'
                                                }`}
                                        >
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: st.hex }} />
                                            {st.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section 8: Relationship */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                                    <Heart className="w-4 h-4" /> Relationship
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {RELATIONSHIPS.map((rel) => (
                                        <button
                                            key={rel}
                                            onClick={() => setVisuals({ ...visuals, relationship: rel })}
                                            className={`px-6 py-3 rounded-full border transition-all font-medium ${visuals.relationship === rel
                                                ? 'border-pink-500 bg-pink-500 text-white'
                                                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600'
                                                }`}
                                        >
                                            {rel}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-10"></div>
                        </motion.div>
                    )}

                    {/* STEP 2: NEGOTIATION */}
                    {step === 'negotiation' && (
                        <motion.div
                            key="negotiation"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full flex-1 flex flex-col justify-end"
                        >
                            {/* Chat Area */}
                            <div className="flex flex-col gap-6 pb-6">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`
                                            max-w-[85%] p-5 rounded-2xl text-lg relative
                                            ${msg.role === 'user'
                                                ? 'bg-pink-600 text-white rounded-br-none'
                                                : 'bg-neutral-800 text-neutral-200 rounded-bl-none border border-neutral-700'}
                                        `}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {/* Typing Indicator */}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-neutral-800 border border-neutral-700 p-4 rounded-2xl rounded-bl-none flex gap-2">
                                            <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce delay-75" />
                                            <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce delay-150" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Fallback space for fixed footer */}
                            <div className="h-24"></div>
                        </motion.div>
                    )}

                    {/* STEP 3: THE REVEAL */}
                    {step === 'reveal' && (
                        <motion.div
                            key="reveal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full flex flex-col items-center justify-center text-center gap-8 py-10"
                        >
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
                                {isGenerating ? "Synthesizing Neural Pattern..." : "Connection Established"}
                            </h2>

                            <div className="relative w-80 h-80 rounded-3xl overflow-hidden border-4 border-neutral-800 shadow-2xl bg-neutral-900 flex items-center justify-center">
                                {isGenerating ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                        <div className="w-full h-full absolute inset-0 bg-gradient-to-tr from-pink-500/20 to-violet-500/20 animate-pulse" />
                                        <Zap className="w-16 h-16 text-pink-500 animate-bounce" />
                                        <p className="text-sm font-mono text-pink-400">Generating DNA...</p>
                                    </div>
                                ) : (
                                    generatedImage && (
                                        <motion.img
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            src={generatedImage}
                                            alt="Generated Blind Date"
                                            className="w-full h-full object-cover"
                                        />
                                    )
                                )}
                            </div>

                            {!isGenerating && (
                                <div className="max-w-md space-y-4">
                                    <h3 className="text-2xl font-bold text-white">{visuals.name}</h3>
                                    <p className="text-neutral-400 italic">"{messages[messages.length - 1]?.content}"</p>

                                    <button
                                        onClick={handleSave}
                                        className="w-full bg-pink-600 hover:bg-pink-500 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all mt-6 shadow-lg shadow-pink-900/50"
                                    >
                                        Start Relationship <Heart className="w-5 h-5 fill-current" />
                                    </button>
                                </div>
                            )}

                            {!isGenerating && !generatedImage && (
                                <div className="max-w-md w-full mt-4">
                                    <button
                                        onClick={generatePortrait}
                                        className="w-full bg-neutral-800 hover:bg-neutral-700 py-3 rounded-xl font-bold text-neutral-300 flex items-center justify-center gap-2 transition-all border border-neutral-700"
                                    >
                                        <Sparkles className="w-4 h-4" /> Try Again
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>

            {/* Sticky Footer for Negotiation */}
            {step === 'visuals' && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-50 flex justify-center backdrop-blur-lg"
                >
                    <button
                        onClick={handleNext}
                        className="bg-white text-black px-8 py-4 rounded-full font-bold text-xl hover:bg-neutral-200 transition-all shadow-xl shadow-white/10 flex items-center gap-2"
                    >
                        Start Personality Negotiation <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            )}

            {step === 'negotiation' && !isLoading && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent z-50 w-full max-w-4xl mx-auto">
                    {/* Suggestion Chips */}
                    {chips.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none mb-2">
                            {chips.map((chip, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSendMessage(chip)}
                                    className="whitespace-nowrap px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-full hover:bg-neutral-700 text-sm font-medium transition-colors"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="relative">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                            placeholder="Type your answer..."
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-full pl-6 pr-14 py-4 focus:outline-none focus:border-pink-500 transition-colors shadow-2xl"
                        />
                        <button
                            onClick={() => handleSendMessage(inputText)}
                            className="absolute right-2 top-2 p-2 bg-pink-600 rounded-full hover:bg-pink-500 transition-colors"
                        >
                            <ArrowRight className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
