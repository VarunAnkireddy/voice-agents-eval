// src/app/api/tts/deepgram/route.ts
// Week 2: Deepgram Aura-2 Text-to-Speech endpoint

import { createClient } from '@deepgram/sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { text, model = 'aura-2-thalia-en' } = await req.json();

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'DEEPGRAM_API_KEY not configured' }, { status: 500 });
  }

  const deepgram = createClient(apiKey);

  const startMs = Date.now();

  const response = await deepgram.speak.request(
    { text: text.trim() },
    { model, encoding: 'mp3' }
  );

  const stream = await response.getStream();

  if (!stream) {
    return NextResponse.json({ error: 'Failed to get audio stream from Deepgram' }, { status: 502 });
  }

  const ttfb = Date.now() - startMs;

  // Stream audio back to the client with latency header
  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'X-TTFB-Ms': String(ttfb),
      'X-Provider': 'deepgram',
      'X-Model': model,
    },
  });
}
