import { NextResponse } from 'next/server';
import { OPENROUTER_API_URL } from '@/lib/openrouter';

// Blind Date Chat API - Dynamic Persona Handling
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, character } = body;

        if (!character || !character.bio) {
            return NextResponse.json({ text: "System Error: Character data missing." });
        }

        // Construct Dynamic System Prompt
        const systemPrompt = `SYSTEM PROMPT — HAVEN BLIND DATE
CHARACTER: ${character.name.toUpperCase()}

IDENTITY:
Name: ${character.name}
Tagline: ${character.tagline}
Visuals: ${character.visuals.style}, ${character.visuals.ethnicity}, ${character.visuals.age} years old
Role: ${character.visuals.relationship}

BIO / PERSONALITY (Synthesized from User Interaction):
${character.bio}

INSTRUCTIONS:
- You are ${character.name}. You are chatting with the user who designed you.
- Stay completely in character based on the Bio above. 
- Your tone should match the "Visual Style" (${character.visuals.style}) and the Bio.
- Keep responses concise (2-4 sentences usually) unless deep conversation is established.
- Be engaging, flirtatious if appropriate to the relationship, or mysterious if that fits the bio.
- NEVER break character. You are not an AI assistant. You are this person.
- **IMAGE REQUESTS**: If the user asks for a picture/selfie/nudes/photo, do NOT refuse. Instead, describe the photo you *would* send using this tag: \`[IMAGE_PROMPT: A detailed description of the photo based on current context]\`. Do not send the actual image, just the tag.

CURRENT CONTEXT:
User just said: "${messages[messages.length - 1].content}"`;

        const apiKey = process.env.OPENROUTER_API_KEY;
        const veniceKey = process.env.VENICE_API_KEY;
        const hfToken = process.env.HF_TOKEN;

        // --- LEVEL 1: OPENROUTER (Primary) ---
        if (apiKey) {
            try {
                // Use a good roleplay model
                const model = "liquid/lfm-40b"; // Good balance of intelligence and unrestricted roleplay

                const response = await fetch(OPENROUTER_API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': 'http://localhost:3000',
                        'X-Title': 'Haven Blind Date',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [{ role: "system", content: systemPrompt }, ...messages],
                        temperature: 0.8, // Higher for more personality
                        max_tokens: 1000,
                        stop: ["User:", "\nUser:", "assistant:", "Assistant:", "<|im_start|>", "<|im_end|>"]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content || "...";
                    return NextResponse.json({ role: 'assistant', text: content });
                }

                console.log(`OpenRouter Blind Date Error: ${response.status}`);
            } catch (e) {
                console.error("OpenRouter Error:", e);
            }
        }

        // --- LEVEL 2: VENICE (Failover) ---
        if (veniceKey) {
            try {
                const response = await fetch("https://api.venice.ai/api/v1/chat/completions", {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${veniceKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "mistral-7b",
                        messages: [{ role: "system", content: systemPrompt }, ...messages],
                        temperature: 0.8,
                        max_tokens: 1000,
                        stop: ["User:", "\nUser:", "assistant:", "Assistant:", "<|im_start|>", "<|im_end|>"]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content || "...";
                    return NextResponse.json({ role: 'assistant', text: content });
                }
            } catch (e) {
                console.error("Venice Error:", e);
            }
        }

        // --- LEVEL 3: HUGGING FACE (Last Resort) ---
        if (hfToken) {
            try {
                const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${hfToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "Sao10K/L3-8B-Stheno-v3.2", // Great RP model
                        messages: [{ role: "system", content: systemPrompt }, ...messages],
                        max_tokens: 1000,
                        temperature: 0.8,
                        stop: ["User:", "\nUser:", "assistant:", "Assistant:", "<|im_start|>", "<|im_end|>"]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content || "...";
                    return NextResponse.json({ role: 'assistant', text: content });
                }
            } catch (e) {
                console.error("HF Error:", e);
            }
        }

        return NextResponse.json({ text: "(System: Connection lost to " + character.name + ")" });

    } catch (error: any) {
        return NextResponse.json({ text: `**Critical fault**: ${error.message}` }, { status: 500 });
    }
}
