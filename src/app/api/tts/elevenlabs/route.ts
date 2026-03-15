// src/app/api/tts/elevenlabs/route.ts
// Week 2: ElevenLabs Text-to-Speech endpoint

import { NextRequest, NextResponse } from 'next/server';

// Default to Rachel (high-quality English voice)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const DEFAULT_MODEL_ID = 'eleven_multilingual_v2';

export async function POST(req: NextRequest) {
  const {
    text,
    voiceId = DEFAULT_VOICE_ID,
    modelId = DEFAULT_MODEL_ID,
  } = await req.json();

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 500 });
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

  const startMs = Date.now();

  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: text.trim(),
      model_id: modelId,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!upstream.ok) {
    const msg = await upstream.text();
    return NextResponse.json({ error: `ElevenLabs error: ${msg}` }, { status: upstream.status });
  }

  const ttfb = Date.now() - startMs;

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'X-TTFB-Ms': String(ttfb),
      'X-Provider': 'elevenlabs',
      'X-Model': modelId,
    },
  });
}
