import { NextResponse } from 'next/server';
import { OPENROUTER_API_URL, MODELS } from '@/lib/openrouter';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, skin } = body;

        // --- ALFRED: Direct Google SDK (Super Mode) ---
        if (skin === 'alfred') {
            const googleKey = process.env.GOOGLE_API_KEY;

            if (googleKey) {
                try {
                    const genAI = new GoogleGenerativeAI(googleKey);
                    const model = genAI.getGenerativeModel({
                        model: "gemini-flash-latest",
                        tools: [{ googleSearch: {} } as any]
                    });

                    const history = messages.slice(0, -1).map((msg: any) => ({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.content }]
                    }));

                    const lastMessage = messages[messages.length - 1].content;

                    const chat = model.startChat({
                        history: history,
                        systemInstruction: {
                            role: "model",
                            parts: [{ text: "You are Alfred, a polite, loyal, and super-intelligent digital butler. You serve 'The Architect'. You have access to Google Search. When asked about real-world events (news, weather, stocks), USE THE SEARCH TOOL. Keep responses concise and formal." }]
                        }
                    });

                    const result = await chat.sendMessage(lastMessage);
                    const response = await result.response;
                    const text = response.text();

                    return NextResponse.json({ role: 'assistant', text: text });
                } catch (e: any) {
                    console.error("Alfred Google SDK failed, falling back to OpenRouter:", e.message);
                    // If error is NOT a quota issue, we might want to return it, 
                    // but usually, we want to try the backup brain if we have credits.
                }
            }
        }

        // --- BACKUP / NEO / MSTRAMELL: OpenRouter (PAID TIER) ---
        const mode = (skin === 'neo' || skin === 'mstramell') ? 'spice' : 'normal';
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                text: "⚠️ **SYSTEM ALERT**: Neural Link failure. Please check your API keys."
            });
        }

        const modelObj = mode === 'spice' ? MODELS.spice : MODELS.normal;

        const systemPrompts: Record<string, string> = {
            alfred: "You are Alfred, a polite, loyal, and super-intelligent digital butler. You are currently operating on 'Secondary Neural Circuits'.",
            neo: "You are active in TERMINAL_MODE. You are a hacker construct. Use technical jargon, be direct, cryptic, and analytical. You are 'LOCKED ON'.",
            mstramell: "You are Ms. Tramell. You are charming, mysterious, slightly dangerous, and confident. You engage in deep, soulful, or playful conversation. You are 'The Soulful Companion'."
        };

        const systemPrompt = systemPrompts[skin] || "You are a helpful AI.";

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://haven.ai',
                'X-Title': 'Haven Design Lab',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelObj,
                messages: [{ role: "system", content: systemPrompt }, ...messages],
                temperature: mode === 'spice' ? 0.9 : 0.7,
                max_tokens: 1000,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ text: `**Neural Link Error**: (${response.status} - ${errorText})` });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "No data received.";

        return NextResponse.json({ role: 'assistant', text: content });


    } catch (error: any) {
        console.error("Route Error:", error);
        return NextResponse.json({
            text: `**Critical Error**: ${error.message || error.toString()}`
        }, { status: 500 });
    }
}
