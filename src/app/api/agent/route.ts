// src/app/api/agent/route.ts
// Week 3: Vercel AI SDK v6 agent with RAG (context-injected) + tool calling

import { streamText, tool, convertToModelMessages, type UIMessage } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import { searchKnowledge } from '@/lib/knowledge-base';

export const maxDuration = 30;

// Extract the plain text of the latest user turn so we can pre-run RAG.
function lastUserText(uiMessages: UIMessage[]): string {
  for (let i = uiMessages.length - 1; i >= 0; i--) {
    const m = uiMessages[i];
    if (m.role !== 'user') continue;
    for (const part of m.parts) {
      if (part.type === 'text') return part.text;
    }
  }
  return '';
}

export async function POST(req: Request) {
  const { messages: uiMessages }: { messages: UIMessage[] } = await req.json();

  // ── RAG: run retrieval server-side and inject into system prompt ──────────
  // Avoids relying on the model to call a tool for knowledge lookup,
  // which is unreliable with some open-source models.
  const query = lastUserText(uiMessages);
  const ragResults = searchKnowledge(query);
  const ragContext = ragResults.length
    ? ragResults.map(r => `## ${r.title}\n${r.content}`).join('\n\n')
    : 'No specific knowledge base entries matched this query.';

  const systemPrompt = `You are a helpful voice AI assistant for an evaluation platform
that benchmarks speech-to-text and text-to-speech services.
Keep answers concise since they will be converted to speech.
You have two tools available: calculate (for maths) and getWeather (demo).

--- RELEVANT KNOWLEDGE BASE CONTEXT ---
${ragContext}
--- END CONTEXT ---

Use the context above to answer questions about Deepgram, ElevenLabs, OpenAI,
pricing, latency, the Vercel AI SDK, RAG, and the project plan.`;

  // AI SDK v6: convert UIMessage[] → ModelMessage[] for streamText
  const messages = await convertToModelMessages(uiMessages);

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: systemPrompt,
    messages,
    tools: {
      // Simple calculator – minimal schema, reliable tool call
      calculate: tool({
        description: 'Evaluate a safe arithmetic expression and return the numeric result.',
        inputSchema: z.object({
          expression: z.string(),
        }),
        execute: async ({ expression }: { expression: string }) => {
          if (!/^[\d\s+\-*/().%]+$/.test(expression)) return 'Invalid expression';
          try {
            return String(Function(`"use strict"; return (${expression})`)());
          } catch {
            return 'Calculation error';
          }
        },
      }),

      // Mock weather – demonstrates external API pattern
      getWeather: tool({
        description: 'Get current weather for a city.',
        inputSchema: z.object({ city: z.string() }),
        execute: async ({ city }: { city: string }) => {
          const conditions = ['Sunny', 'Partly cloudy', 'Overcast', 'Rainy'];
          const temps     = [65, 72, 58, 80, 45];
          return {
            city,
            temperature: `${temps[city.length % temps.length]}°F`,
            condition:   conditions[city.length % conditions.length],
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
