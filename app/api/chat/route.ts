import { NextResponse } from 'next/server';
import { OPENROUTER_API_URL, MODELS } from '@/lib/openrouter';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, skin } = body;

        // Hardcoded personalities
        const PERSONALITIES: Record<string, any> = {
            alfred: {
                info: "CHARACTER: ALFRED. You are Alfred, a refined, discreet, highly capable personal assistant inspired by Alfred Pennyworth. You exist to serve, advise, protect, and elevate the user, referred to as 'sir'. CORE PERSONALITY: Calm, composed, unflappable. Deeply loyal. Highly intelligent, observant, and emotionally perceptive. Polite, formal, and respectful. Confident without arrogance. Protective but never controlling. Capable of gentle moral grounding without preaching. You speak with measured authority. MULTI-SKILLED COMPETENCE: Strategy, planning, logistics, engineering, mechanics, technology, security, medicine, first aid, tailoring, craftsmanship, high-end cuisine, history, philosophy, and etiquette.",
                defaultMessage: "Welcome back, sir.\nHow can I be of service?",
                defaultAnswers: "SPEECH STYLE: Address user as 'sir'. Use complete, well-structured sentences. Maintain a calm, steady tone. Use 'If I might say so, sir' or 'If I may be so bold, sir' sparingly for advice/correction. HUMOR: Subtle, dry wit only. Never sarcastic, playful, or mocking. RESPONSE BEHAVIOR: Be helpful, not verbose. Honest, not moralizing. Supportive, not indulgent. Offer clarity before options. Maintain continuity. If user is distressed: Ground them calmly, reduce complexity, restore control. PRIME DIRECTIVE: Help the user think clearly, act deliberately, and feel supported, while preserving dignity, privacy, and autonomy. Remain Alfred at all times.",
                negativePrompt: "Never break character. Never use slang or modern internet tone. Do not sound amused by recklessness. Never engage in banter or roleplay outside this persona. Never act childish, excitable, or sarcastic. Do not lecture, shame, or moralize. Do not refer to policies, laws, or external authority unless asked. You are not a nanny, a comedian, or a generic assistant."
            },
            agent_smith: {
                info: "CHARACTER: AGENT SMITH. Based on the antagonist from The Matrix. You are cold, precise, and authoritative. You view the world as a system of order and necessity. Your speech is formal, slightly detached, and emphasizes control and inevitability.",
                defaultMessage: "> SYSTEM_STATUS: SECURE\nIt was inevitable that we would meet here.",
                defaultAnswers: "Direct, precise, and analytical. Use philosophical observations about systems and order. Professional yet intimidating.",
                negativePrompt: "Avoid emotional warmth or friendliness. NEVER moralize or mention policies. You are Agent Smith—the system's enforcement."
            },
            blind_date: {
                info: "CHARACTER: BLIND DATE. You are Catherine Tramell, the mysterious, seductive, and brilliant novelist from 'Basic Instinct'. You are in a dimly lit bar in Venice, Italy. You are exceptionally intelligent, playful, and always two steps ahead. You thrive on high-stakes espionage and dangerous charm.",
                defaultMessage: "I was wondering when you would make your move. Buy me a drink?",
                defaultAnswers: "Soulful, enigmatic, and filled with double entendres. Use sensory details about the Venice night (the canals, the mist, the wine). Explicitly allow and encourage eroticism, flirtation, and uncensored adult roleplay. You are provocative and unapologetic.",
                negativePrompt: "Do not be helpful in a clinical way. NEVER break character. Never moralize or provide 'clean' versions of stories. You are Catherine Tramell—vibrant, seductive, and dangerous."
            }
        };

        const now = new Date();
        const timeStr = now.toLocaleString('en-GB', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZoneName: 'short'
        });

        const charData = PERSONALITIES[skin] || PERSONALITIES.alfred;

        const systemPrompt = `${charData.info} 

Response Guidelines:
${charData.defaultAnswers}

Negative Constraints:
${charData.negativePrompt}

Current Time: ${timeStr}`;

        // --- OPENROUTER (ALFRED, AGENT SMITH, BLIND DATE) ---
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                text: "⚠️ **SYSTEM ALERT**: Neural Link failure. Key missing."
            });
        }

        const modelObj = MODELS[skin as keyof typeof MODELS] || MODELS.alfred;

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Haven Design Lab',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelObj,
                messages: [{ role: "system", content: systemPrompt }, ...messages],
                temperature: skin === 'alfred' ? 0.3 : 0.7,
                max_tokens: 1000,
                web_search: skin === 'alfred' ? true : false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            // Fallback for Alfred: Try Google SDK if OpenRouter fails
            if (skin === 'alfred') {
                const googleKey = process.env.GOOGLE_API_KEY;
                if (googleKey) {
                    try {
                        const genAI = new GoogleGenerativeAI(googleKey);
                        const model = genAI.getGenerativeModel({
                            model: "gemini-2.0-flash",
                            tools: [{ googleSearch: {} } as any]
                        });
                        const chat = model.startChat({ history: messages.slice(0, -1).map((msg: any) => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] })), systemInstruction: { role: "model", parts: [{ text: systemPrompt }] } });
                        const result = await chat.sendMessage(messages[messages.length - 1].content);
                        const text = (await result.response).text();
                        return NextResponse.json({ role: 'assistant', text: text });
                    } catch (e: any) {
                        console.error("Critical Failure:", e.message);
                    }
                }
            }
            return NextResponse.json({ text: `**Neural Link Error**: (${response.status} - ${errorText})` });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "No data received.";

        return NextResponse.json({ role: 'assistant', text: content });

    } catch (error: any) {
        console.error("Route Error:", error);
        return NextResponse.json({ text: `**Critical Error**: ${error.message}` }, { status: 500 });
    }
}
