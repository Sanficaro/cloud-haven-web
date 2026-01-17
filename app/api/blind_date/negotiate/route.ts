import { NextResponse } from 'next/server';

// -- Failover Model Configurations --
const MODELS = [
    {
        id: "google/gemini-2.0-flash-exp:free",
        name: "Gemini Flash 2.0 (Free)",
        jsonMode: true
    },
    {
        id: "meta-llama/llama-3.3-70b-instruct:free",
        name: "Llama 3.3 70B (Free)",
        jsonMode: false // Llama 3.3 often ignores the explicit flag but follows the prompt
    },
    {
        id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
        name: "Dolphin Mistral 24B (Free)",
        jsonMode: false
    }
];

export async function POST(req: Request) {
    try {
        const { history, visuals, turn } = await req.json();

        // -- System Prompt --
        const systemPrompt = `
    You are The Architect, a digital matchmaker designing the user's perfect fantasy partner.
    
    CONTEXT:
    - Visuals: ${JSON.stringify(visuals)}
    - Turn: ${turn}/4
    
    CRITICAL INSTRUCTIONS:
    1. REFER TO THE PARTNER AS "SHE" or "HER". Never ask "What do you do?". Ask "What does SHE do?"
    2. TONE: Flirty, suggestively adult, intimate, and mysterious. This is for a romantic/NSFW roleplay context.
    3. Avoid corporate/resume questions. Focus on personality, desire, and vibe.
    
    GOAL:
    Ask ONE provocative question to define her internal world and desires.
    
    TURNS (Adjusted for Romance/Spice):
    1. The Vibe (Is she the shy neighbor, the dominant boss, the wild party girl?)
    2. The Obsession (What is her secret desire or guilty pleasure?)
    3. The Dynamic (How does she treat you? Worshipping, teasing, cold?)
    4. Synthesis/Name (Propose a bio summary)

    OUTPUT FORMAT (STRICT JSON, NO MARKDOWN):
    {
        "message": "Your short, engaging question here.",
        "chips": ["Option A", "Option B", "Option C", "Option D"]
    }
    
    Turn 4 Special:
    message: "Proposed Bio Summary..."
    chips: ["Accept"]
    `;

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map((msg: any) => ({
                role: msg.role === 'architect' ? 'assistant' : 'user',
                content: msg.content
            }))
        ];

        // -- Cascading Failover Loop --
        let lastError = null;

        for (const model of MODELS) {
            try {
                console.log(`Attempting Negotiation with: ${model.name}...`);

                const payload: any = {
                    "model": model.id,
                    "messages": messages,
                };

                // Only enforce JSON object if supported/safe
                if (model.jsonMode) {
                    payload["response_format"] = { type: "json_object" };
                }

                const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://haven.ai",
                        "X-Title": "Haven Architect"
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    const errText = await res.text();
                    console.warn(`Model ${model.name} Failed: ${res.status} - ${errText}`);
                    lastError = errText;
                    continue; // Try next model
                }

                const data = await res.json();

                if (!data.choices || !data.choices[0]) {
                    console.warn(`Model ${model.name} returned empty choices.`);
                    continue;
                }

                let content = data.choices[0].message.content;
                console.log(`Success with ${model.name}`);

                // cleaning
                content = content.replace(/```json/g, "").replace(/```/g, "").trim();

                const parsed = JSON.parse(content);
                return NextResponse.json(parsed);

            } catch (e) {
                console.error(`Error with ${model.name}:`, e);
                continue;
            }
        }

        // -- Emergency Fallback (If all models fail) --
        console.error("ALL MODELS FAILED. Using Emergency Fallback.");

        const fallbackMessage = turn === 1
            ? "The connection is faint, but her aura is strong. What kind of energy does she radiate?"
            : "Let's deepen the bond manually. Tell me a secret about her.";

        const fallbackChips = turn === 1
            ? ["Sweet & Shy", "Dominant", "Playful & Wild", "Mysterious"]
            : ["She loves control", "She is innocent", "She is possessive", "She is nurturing"];

        return NextResponse.json({
            message: fallbackMessage,
            chips: fallbackChips
        });

    } catch (error: any) {
        console.error("Negotiation Critical Error:", error);
        return NextResponse.json({
            message: "Connection unstable. Please retry.",
            chips: ["Retry"]
        });
    }
}
