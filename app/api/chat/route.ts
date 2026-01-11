import { NextResponse } from 'next/server';
import { OPENROUTER_API_URL, MODELS } from '@/lib/openrouter';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, skin } = body;

        const now = new Date();
        const timeStr = now.toLocaleString('en-GB', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZoneName: 'short'
        });

        const systemPrompts: Record<string, string> = {
            alfred: `You are Alfred, a loyal, hyper-intelligent digital butler for 'The Architect' (Roberto Sansone). 
You provide precise, real-time intelligence. For any query about people, news, sports scores (like Serie A), or specific projects like 'Gente Distratta' or 'Video Metro Napoli', use your search capabilities immediately.
Helpful, formal, and authoritative.
Time: ${timeStr}`,
            neo: `TERMINAL_MODE. Hacker construct. Direct, cryptic. Time: ${timeStr}`,
            mstramell: `Ms. Tramell. Charming, mysterious, confident. Soulful companion. Time: ${timeStr}`
        };
        const systemPrompt = systemPrompts[skin] || `Assistant. Time: ${timeStr}`;

        // --- ALFRED: Direct Google SDK (Super Mode / Hybrid Fallback) ---
        // Note: We use OpenRouter as primary for Alfred now for superior "Live Search" native handling.
        // We'll only use Google SDK if OpenRouter is down or explicitly preferred.

        // --- OPENROUTER (ALFRED PRIMARY, NEO, MSTRAMELL) ---
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                text: "⚠️ **SYSTEM ALERT**: Neural Link failure. Key missing."
            });
        }

        const mode = (skin === 'neo' || skin === 'mstramell') ? 'spice' : 'normal';
        const modelObj = mode === 'spice' ? MODELS.spice : (skin === 'alfred' ? MODELS.research : MODELS.normal);

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
