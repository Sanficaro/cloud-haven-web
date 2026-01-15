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

        const requestBody = {
            prompt: enhancedPrompt,
            negative_prompt: "ugly, distorted, low quality, blurry, cartoon, anime, drawings, floating limbs, extra fingers, deformed hands, bad anatomy",
            samples: 1,
            scheduler: "UniPC",
            num_inference_steps: 25,
            guidance_scale: 8,
            seed: Math.floor(Math.random() * 2147483647),
            img_width: 512,
            img_height: 512,
            base64: false
        };

        console.log(`[ImageGen] Calling Segmind API...`);

        const response = await fetch(SEGMIND_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'SG_8e8f7c6d5b4a3f2e' // Free tier anonymous key
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[ImageGen] Segmind error ${response.status}:`, errorText);

            // If Segmind fails, fall back to simple Pollinations without model parameter
            console.log(`[ImageGen] Falling back to basic Pollinations...`);
            const encodedPrompt = encodeURIComponent(prompt);
            const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

            const fallbackResponse = await fetch(fallbackUrl);
            if (fallbackResponse.ok) {
                const fallbackBlob = await fallbackResponse.blob();
                console.log(`[ImageGen] Fallback SUCCESS (${fallbackBlob.size} bytes)`);
                return new NextResponse(fallbackBlob, {
                    headers: {
                        "Content-Type": "image/jpeg",
                        "X-Generated-By": "Pollinations/Fallback"
                    }
                });
            }

            throw new Error(`Both services failed`);
        }

        const imageBlob = await response.blob();
        console.log(`[ImageGen] SUCCESS (${imageBlob.size} bytes)`);

        return new NextResponse(imageBlob, {
            headers: {
                "Content-Type": "image/png",
                "X-Generated-By": "Segmind/SDXL",
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
