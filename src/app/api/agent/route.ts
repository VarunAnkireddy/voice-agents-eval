// src/app/api/agent/route.ts
// Week 3: Vercel AI SDK v6 agent with tool calling and RAG

import { streamText, tool, stepCountIs, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { searchKnowledge } from '@/lib/knowledge-base';

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a helpful voice AI assistant for an evaluation platform
that benchmarks speech-to-text and text-to-speech services. You have access to a
knowledge base about the platform, pricing, and capabilities. When asked about
specific topics use the searchKnowledge tool to retrieve accurate information.
Use the calculate tool for any numerical queries. Keep responses concise since
they will be converted to speech.`;

export async function POST(req: Request) {
  const { messages: uiMessages } = await req.json();

  // AI SDK v6: useChat sends UIMessage[], but streamText expects ModelMessage[].
  const messages = await convertToModelMessages(uiMessages);

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: SYSTEM_PROMPT,
    messages,
    stopWhen: stepCountIs(5),
    tools: {
      // RAG tool – searches the in-memory knowledge base
      searchKnowledge: tool({
        description:
          'Search the voice AI evaluation knowledge base for information about ' +
          'Deepgram, ElevenLabs, OpenAI, pricing, latency, and the project plan.',
        inputSchema: z.object({
          query: z.string().describe('Search query'),
        }),
        execute: async ({ query }: { query: string }) => {
          const results = searchKnowledge(query);
          if (results.length === 0) return 'No relevant information found.';
          return results
            .map(r => `### ${r.title}\n${r.content}`)
            .join('\n\n');
        },
      }),

      // Calculator tool
      calculate: tool({
        description: 'Evaluate a mathematical expression and return the result.',
        inputSchema: z.object({
          expression: z
            .string()
            .describe('A safe arithmetic expression, e.g. "10000 * 0.0043"'),
        }),
        execute: async ({ expression }: { expression: string }) => {
          // Only allow safe arithmetic characters
          if (!/^[\d\s+\-*/().%]+$/.test(expression)) {
            return 'Invalid expression';
          }
          try {
            const result = Function(`"use strict"; return (${expression})`)();
            return String(result);
          } catch {
            return 'Calculation error';
          }
        },
      }),

      // Mock weather tool (demonstrates external API pattern)
      getWeather: tool({
        description: 'Get the current weather for a city (demo tool).',
        inputSchema: z.object({
          city: z.string().describe('City name'),
        }),
        execute: async ({ city }: { city: string }) => {
          // Mock response – replace with a real weather API call in production
          const conditions = ['Sunny', 'Partly cloudy', 'Overcast', 'Rainy'];
          const temps = [65, 72, 58, 80, 45];
          const condition = conditions[city.length % conditions.length];
          const temp = temps[city.length % temps.length];
          return { city, temperature: `${temp}°F`, condition };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
