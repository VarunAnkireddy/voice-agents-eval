# Voice Agents Eval

A Next.js app for evaluating voice-agent capabilities across a 4-week phased benchmark:

- **Week 1:** STT benchmarking
- **Week 2:** TTS comparison
- **Week 3:** Agentic prototype (RAG + tool calling)
- **Week 4:** Cost analysis

## Step-by-step setup

### 1) Prerequisites

- Node.js 20+
- npm 10+

### 2) Install dependencies

```bash
npm install
```

### 3) Configure environment variables

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

If `.env.local.example` is not present, create `.env.local` manually with:

```env
# Deepgram
DEEPGRAM_API_KEY=your_deepgram_api_key
DEEPGRAM_PROJECT_ID=your_deepgram_project_id
NEXT_PUBLIC_DEEPGRAM_API_KEY=your_deepgram_key_for_client_ws

# ElevenLabs (Week 2)
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# OpenAI (Week 3 agent route via AI SDK)
OPENAI_API_KEY=your_openai_api_key
```

### 4) Run the app locally

```bash
npm run dev
```

Open http://localhost:3000.

### 5) Use the benchmark tabs

- **Week 1:** STT benchmark flow
- **Week 2:** TTS provider comparison
- **Week 3:** Voice agent (RAG + tools)
- **Week 4:** Cost analysis dashboard

## Validation commands

Run linting:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

> Note: In network-restricted environments, `npm run build` can fail when fetching Google Fonts used by Next.js (`Geist` / `Geist Mono`).
