import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const { prompt, model = 'flux-1-schnell', width = 1024, height = 1024 } = await req.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required for image generation.' }, { status: 400 });
    }

    const cleanPrompt = prompt.trim();

    // Check environment variables or client header for API keys
    const togetherApiKey = (
      process.env.TOGETHER_API_KEY ||
      process.env.TOGETHER_AI_API_KEY ||
      process.env.IMAGE_GEN_API_KEY ||
      process.env.NEXT_PUBLIC_IMAGE_GEN_API_KEY ||
      req.headers.get('x-image-api-key') ||
      ''
    ).trim();

    const openAiApiKey = (
      process.env.OPENAI_API_KEY ||
      (togetherApiKey.startsWith('sk-') ? togetherApiKey : '')
    ).trim();

    let imageUrl = '';
    let providerUsed = 'Pollinations AI';

    // 1. Primary Provider: Together AI (FLUX.1 Schnell / FLUX.1 Dev / SDXL)
    if (togetherApiKey && !togetherApiKey.startsWith('sk-') && !togetherApiKey.startsWith('hf_')) {
      try {
        let togetherModel = 'black-forest-labs/FLUX.1-schnell';
        if (model === 'stable-diffusion-xl') {
          togetherModel = 'stabilityai/stable-diffusion-xl-base-1.0';
        } else if (model === 'flux-1-dev') {
          togetherModel = 'black-forest-labs/FLUX.1-dev';
        }

        const togetherRes = await fetch('https://api.together.xyz/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${togetherApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: togetherModel,
            prompt: cleanPrompt,
            width,
            height,
            steps: 4,
            n: 1,
            response_format: 'url',
          }),
        });

        if (togetherRes.ok) {
          const data = await meJson(togetherRes);
          if (data.data?.[0]?.url) {
            imageUrl = data.data[0].url;
            providerUsed = `Together AI (${togetherModel.split('/')[1] || 'FLUX'})`;
          } else if (data.data?.[0]?.b64_json) {
            imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
            providerUsed = `Together AI (${togetherModel.split('/')[1] || 'FLUX'})`;
          }
        } else {
          const errData = await meJson(togetherRes);
          console.warn('Together AI API Response Error:', errData);
        }
      } catch (e) {
        console.warn('Together AI API Call Exception:', e);
      }
    }

    // 2. OpenAI DALL-E Fallback if key starts with sk-
    if (!imageUrl && openAiApiKey && openAiApiKey.startsWith('sk-')) {
      try {
        const openAiRes = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: cleanPrompt,
            n: 1,
            size: `${width}x${height}`,
          }),
        });

        if (openAiRes.ok) {
          const data = await meJson(openAiRes);
          if (data.data?.[0]?.url) {
            imageUrl = data.data[0].url;
            providerUsed = 'OpenAI DALL-E 3';
          }
        }
      } catch (e) {
        console.warn('OpenAI DALL-E 3 fallback exception:', e);
      }
    }

    // 3. Fallback: High-resolution Pollinations AI engine
    if (!imageUrl) {
      const seed = Math.floor(Math.random() * 1000000);
      const encodedPrompt = encodeURIComponent(cleanPrompt);
      imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
      providerUsed = togetherApiKey ? 'Pollinations FLUX' : 'Pollinations FLUX (Free Fallback)';
    }

    const endTime = Date.now();
    const latencyMs = endTime - startTime;

    return NextResponse.json({
      imageUrl,
      prompt: cleanPrompt,
      model,
      provider: providerUsed,
      latencyMs,
      hasTogetherApiKey: Boolean(togetherApiKey),
    });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Image Generation API Error:', errorMsg);
    return NextResponse.json({ error: errorMsg || 'Failed to generate image' }, { status: 500 });
  }
}

async function meJson(res: Response) {
  return await res.json().catch(() => ({}));
}
