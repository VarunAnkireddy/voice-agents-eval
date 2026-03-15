// src/lib/knowledge-base.ts
// Week 3: In-memory knowledge base for RAG demonstrations.
// Each entry represents a "document chunk" about the voice AI project.

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: 'kb-1',
    title: 'Deepgram Nova-3 Overview',
    content:
      'Deepgram Nova-3 is Deepgram\'s latest-generation speech-to-text model, ' +
      'offering industry-leading accuracy and ultra-low latency. It supports ' +
      'real-time streaming via WebSocket, smart formatting, punctuation, ' +
      'and diarization. Pricing is $0.0043 per minute, roughly 28% cheaper ' +
      'than OpenAI Whisper at $0.006 per minute.',
    tags: ['deepgram', 'stt', 'nova-3', 'latency', 'pricing', 'week1'],
  },
  {
    id: 'kb-2',
    title: 'OpenAI Whisper Comparison',
    content:
      'OpenAI Whisper is a batch-processing STT model with strong accuracy ' +
      'across many languages. It costs $0.006/min. Unlike Deepgram, it does not ' +
      'natively support real-time WebSocket streaming—audio must be uploaded as a ' +
      'file. This makes it unsuitable for ultra-low-latency voice agents where ' +
      'Deepgram Nova-3 excels with TTFB under 300 ms.',
    tags: ['openai', 'whisper', 'stt', 'comparison', 'pricing', 'week1'],
  },
  {
    id: 'kb-3',
    title: 'Deepgram Aura-2 TTS',
    content:
      'Deepgram Aura-2 is a neural TTS service offering multiple English voices ' +
      '(e.g., Thalia, Asteria, Luna). It is optimised for low-latency applications ' +
      'and returns streaming audio. Pricing: $0.015 per 1,000 characters. ' +
      'The REST API accepts plain text and returns MP3 audio, making it easy to ' +
      'integrate into Next.js API routes.',
    tags: ['deepgram', 'tts', 'aura', 'week2'],
  },
  {
    id: 'kb-4',
    title: 'ElevenLabs TTS',
    content:
      'ElevenLabs provides high-quality multilingual TTS with voice cloning. ' +
      'The Eleven Multilingual v2 model produces natural-sounding speech. ' +
      'Pricing starts at $0.30 per 1,000 characters (Starter plan) but can ' +
      'drop to $0.10+ at scale. ElevenLabs excels in emotional range and voice ' +
      'diversity but has higher latency and cost compared with Deepgram Aura.',
    tags: ['elevenlabs', 'tts', 'comparison', 'pricing', 'week2'],
  },
  {
    id: 'kb-5',
    title: 'Vercel AI SDK v6',
    content:
      'Vercel AI SDK v6 (package: ai@6.x) provides React hooks and server ' +
      'utilities for building AI-powered UIs. Key features: useChat for ' +
      'multi-turn chat, streamText for server-side streaming, tool definitions ' +
      'with Zod schemas, and multi-step agent loops via maxSteps. The SDK ' +
      'supports OpenAI, Anthropic, Google, and many other providers.',
    tags: ['vercel', 'ai-sdk', 'streaming', 'tools', 'week2', 'week3'],
  },
  {
    id: 'kb-6',
    title: 'Retrieval-Augmented Generation (RAG)',
    content:
      'RAG enhances LLM responses by retrieving relevant context from a knowledge ' +
      'base before generating an answer. In production, documents are embedded into ' +
      'a vector store (e.g. Pinecone, pgvector). At query time, the top-k nearest ' +
      'neighbours are retrieved and injected into the prompt. This project ' +
      'demonstrates RAG with an in-memory keyword search for simplicity.',
    tags: ['rag', 'retrieval', 'embeddings', 'week3'],
  },
  {
    id: 'kb-7',
    title: 'Agentic Function Tool Calls',
    content:
      'An AI agent can invoke external tools (functions) to fetch real-time data ' +
      'or perform actions. With Vercel AI SDK, tools are defined with a Zod schema ' +
      'and an execute function. The model decides when to call a tool and the SDK ' +
      'handles the round-trip. Examples: weather lookup, calculations, ' +
      'knowledge-base search, and calendar events.',
    tags: ['tools', 'function-calling', 'agent', 'week3'],
  },
  {
    id: 'kb-8',
    title: 'Cost & Applicability Analysis',
    content:
      'For a production voice agent handling 10,000 minutes/month: ' +
      'Deepgram Nova-3 STT = $43, OpenAI Whisper = $60. ' +
      'Deepgram Aura-2 TTS (avg 500 chars/response × 5 responses/min × 10k min) ' +
      '= ~$375. ElevenLabs TTS same traffic = ~$1,500+. ' +
      'Recommendation: Deepgram for both STT and TTS delivers the best latency ' +
      'and cost profile for real-time voice agents at scale.',
    tags: ['cost', 'analysis', 'comparison', 'production', 'week4'],
  },
];

/**
 * Simple keyword-based retrieval (no external embeddings needed).
 * Returns top-k entries ranked by term overlap with the query.
 */
export function searchKnowledge(query: string, topK = 3): KnowledgeEntry[] {
  const terms = query
    .toLowerCase()
    .split(/\W+/)
    .filter(t => t.length > 2);

  if (terms.length === 0) return KNOWLEDGE_BASE.slice(0, topK);

  return KNOWLEDGE_BASE
    .map(entry => {
      const haystack = `${entry.title} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase();
      const score = terms.reduce((acc, t) => acc + (haystack.split(t).length - 1), 0);
      return { entry, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ entry }) => entry);
}
