// src/app/page.tsx
'use client';

import { useState } from 'react';
import FluxBenchmark from '@/components/FluxBenchmark';
import TTSComparison from '@/components/TTSComparison';
import VoiceAgent from '@/components/VoiceAgent';
import CostAnalysis from '@/components/CostAnalysis';

const TABS = [
  {
    id: 'week1',
    label: 'Week 1',
    title: 'STT Benchmark',
    description: 'Deepgram Nova-3 latency, accuracy & pricing vs OpenAI Whisper',
  },
  {
    id: 'week2',
    label: 'Week 2',
    title: 'TTS Comparison',
    description: 'Deepgram Aura-2 vs ElevenLabs quality & latency · Vercel AI SDK v6',
  },
  {
    id: 'week3',
    label: 'Week 3',
    title: 'Agentic Prototype',
    description: 'Working voice agent with RAG knowledge retrieval & function tool calls',
  },
  {
    id: 'week4',
    label: 'Week 4',
    title: 'Cost Analysis',
    description: 'End-to-end cost modelling & applicability analysis for production',
  },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('week1');
  const current = TABS.find(t => t.id === activeTab)!;

  return (
    <main className="min-h-screen bg-white text-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Voice AI Evaluation
          </h1>
          <p className="text-slate-500 text-lg">
            Agentic Voice Platform · 4-Week Phased Benchmark
          </p>
        </header>

        {/* Tab Navigation */}
        <nav className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="block text-xs font-bold">{tab.label}</span>
              <span className="block truncate">{tab.title}</span>
            </button>
          ))}
        </nav>

        {/* Active tab description */}
        <div className="text-center">
          <p className="text-slate-500 text-sm">{current.description}</p>
        </div>

        {/* Tab Content */}
        <section>
          {activeTab === 'week1' && <FluxBenchmark />}
          {activeTab === 'week2' && <TTSComparison />}
          {activeTab === 'week3' && <VoiceAgent />}
          {activeTab === 'week4' && <CostAnalysis />}
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-slate-100 flex justify-between text-sm text-slate-400">
          <p>Project: Agentic Voice Platform</p>
          <p>
            {activeTab === 'week1' && 'Deliverable: STT Benchmark'}
            {activeTab === 'week2' && 'Deliverable: TTS Comparison + Vercel AI SDK'}
            {activeTab === 'week3' && 'Deliverable: Working Prototype (RAG + Tools)'}
            {activeTab === 'week4' && 'Deliverable: Cost & Applicability Analysis'}
          </p>
        </footer>
      </div>
    </main>
  );
}
