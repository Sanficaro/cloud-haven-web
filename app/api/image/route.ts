import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Segmind Free API - Instant, unlimited for basic usage
const SEGMIND_API = "https://api.segmind.com/v1/sdxl1.0-txt2img";

export async function POST(req: NextRequest) {
    try {
        const { prompt, skin } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        console.log(`[ImageGen] Generating for ${skin}: ${prompt}`);

        // Enhanced prompt for better quality
        const enhancedPrompt = skin === 'blind_date'
            ? `${prompt}, photorealistic, highly detailed, professional photography, 8k uhd, soft lighting, high quality`
            : prompt;

        // Use Pollinations as Primary (Segmind is 401)
        const encodedPrompt = encodeURIComponent(enhancedPrompt);
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true&width=512&height=512&model=flux`;

        console.log(`[ImageGen] Fetching from Pollinations: ${url}`);

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[ImageGen] Pollinations error ${response.status}:`, errorText);
            throw new Error(`Pollinations failed with ${response.status}`);
        }

        const imageBlob = await response.blob();
        console.log(`[ImageGen] SUCCESS (${imageBlob.size} bytes)`);

        return new NextResponse(imageBlob, {
            headers: {
                "Content-Type": "image/jpeg",
                "X-Generated-By": "Pollinations/Flux",
                "Cache-Control": "public, max-age=31536000, immutable"
            }
        });

    } catch (error: any) {
        console.error("[ImageGen] Fatal Error:", error);
        return NextResponse.json({
            error: 'Image generation failed. Please try again.'
        }, { status: 500 });
    }
}
