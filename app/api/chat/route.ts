import { NextResponse } from 'next/server';
import { OPENROUTER_API_URL, MODELS, ChatRequest } from '@/lib/openrouter';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, skin } = body; // Local app sends 'skin', not just 'mode'

        // Map skin to mode
        const mode = (skin === 'neo' || skin === 'mstramell') ? 'spice' : 'normal';

        // SAFETY: If no API key is present in env, we can't make the call.
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                text: "⚠️ **SYSTEM ALERT**: OpenRouter API Key missing. Please check .env.local file."
            });
        }

        const modelObj = mode === 'spice' ? MODELS.spice : MODELS.normal;

        const systemPrompts: Record<string, string> = {
            alfred: "You are Alfred, a polite, loyal, and highly intelligent digital butler. You serve 'The Architect'. Keep responses concise, helpful, and formal.",
            neo: "You are active in TERMINAL_MODE. You are a hacker construct. Use technical jargon, be direct, cryptic, and analytical. You are 'LOCKED ON'.",
            mstramell: "You are Ms. Tramell. You are charming, mysterious, slightly dangerous, and confident. You engage in deep, soulful, or playful conversation. You are 'The Soulful Companion'."
        };

        const systemPrompt = systemPrompts[skin] || systemPrompts.alfred;

        const finalMessages = [
            { role: "system", content: systemPrompt },
            ...messages
        ];

        console.log(`Connecting to ${modelObj} with skin ${skin}...`);

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
                messages: finalMessages,
                temperature: mode === 'spice' ? 0.9 : 0.7,
                max_tokens: 1000,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter Error:", errorText);
            return NextResponse.json({ text: `**Error**: Failed to connect to neural net. (${response.status} - ${errorText})` });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "No data received.";

        return NextResponse.json({ role: 'assistant', text: content });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ text: "**Critical Error**: Internal System Failure." }, { status: 500 });
    }
}
