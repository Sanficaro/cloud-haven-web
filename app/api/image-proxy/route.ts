import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const prompt = searchParams.get('prompt');

    if (!prompt) {
        return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    // Use OpenRouter with Gemini 2.5 Flash Image
    const openRouterKey = "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";

    try {
        const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openRouterKey}`,
                "HTTP-Referer": "https://localhost:3000",
                "X-Title": "Haven"
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash-image",
                messages: [{ role: "user", content: `generate a high resolution image of: ${prompt}` }],
                modalities: ["image", "text"]
            })
        });

        if (!orResponse.ok) {
            const errText = await orResponse.text();
            console.error("OpenRouter API Failed:", orResponse.status, errText);
            return NextResponse.json({ error: `OpenRouter Failed: ${orResponse.status}` }, { status: 500 });
        }

        const data = await orResponse.json();

        // OpenRouter Modality returns images in message.images array
        const imageData = data.choices[0]?.message?.images?.[0]?.image_url?.url;

        if (imageData && imageData.startsWith('data:image')) {
            // Convert base64 to binary
            const base64Data = imageData.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': 'public, max-age=31536000, immutable'
                }
            });
        }

        // Fallback: Check if it's a URL in text
        const content = data.choices[0]?.message?.content || "";
        const urlMatch = content.match(/\((https:\/\/.*?)\)/) || content.match(/(https:\/\/.*?)(?:\s|$)/);

        if (urlMatch && urlMatch[1]) {
            return NextResponse.redirect(urlMatch[1]);
        }

        console.error("No Image Data or URL found in response:", JSON.stringify(data).substring(0, 500));
        return NextResponse.json({ error: "Model did not return image data." }, { status: 500 });

    } catch (error: any) {
        console.error("Proxy Exception:", error);
        return NextResponse.json({ error: `Server Exception: ${error.message}` }, { status: 500 });
    }
}
