// src/components/CostAnalysis.tsx
// Week 4: Cost & Applicability Analysis for all tested platforms
'use client';

import { useState } from 'react';

// ── Pricing tables (as of 2025) ─────────────────────────────────────────────

const STT_PROVIDERS = [
  {
    name: 'Deepgram Nova-3',
    perMin: 0.0043,
    streaming: true,
    wer: '6.8%',
    latencyMs: '<300',
    recommendation: 'Best for real-time voice agents',
  },
  {
    name: 'OpenAI Whisper',
    perMin: 0.006,
    streaming: false,
    wer: '7.2%',
    latencyMs: '1,500–3,000',
    recommendation: 'Best for batch transcription pipelines',
  },
];

const TTS_PROVIDERS = [
  {
    name: 'Deepgram Aura-2',
    perKChar: 0.015,
    streaming: true,
    quality: '★★★★☆',
    latencyMs: '<400',
    recommendation: 'Best latency & cost for voice agents',
  },
  {
    name: 'ElevenLabs v2',
    perKChar: 0.30,
    streaming: true,
    quality: '★★★★★',
    latencyMs: '600–1,200',
    recommendation: 'Best quality; use for premium experiences',
  },
];

// ── Calculator ───────────────────────────────────────────────────────────────

function calcSTT(minsPerMonth: number) {
  return STT_PROVIDERS.map(p => ({
    name: p.name,
    cost: (minsPerMonth * p.perMin).toFixed(2),
  }));
}

function calcTTS(responsesPerMin: number, avgCharsPerResponse: number, minsPerMonth: number) {
  const totalKChars = (responsesPerMin * avgCharsPerResponse * minsPerMonth) / 1000;
  return TTS_PROVIDERS.map(p => ({
    name: p.name,
    cost: (totalKChars * p.perKChar).toFixed(2),
  }));
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CostAnalysis() {
  const [minsPerMonth, setMinsPerMonth] = useState(10_000);
  const [responsesPerMin, setResponsesPerMin] = useState(5);
  const [avgCharsPerResponse, setAvgCharsPerResponse] = useState(300);

  const sttCosts = calcSTT(minsPerMonth);
  const ttsCosts = calcTTS(responsesPerMin, avgCharsPerResponse, minsPerMonth);
  const totalDeepgram =
    parseFloat(sttCosts[0].cost) + parseFloat(ttsCosts[0].cost);
  const totalMixed =
    parseFloat(sttCosts[1].cost) + parseFloat(ttsCosts[1].cost);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-xl rounded-2xl border border-gray-100 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Cost &amp; Applicability Analysis</h2>
        <p className="text-sm text-gray-400 mt-0.5">Week 4 · Full-stack cost modelling for production voice agents</p>
      </div>

      {/* ── STT Comparison ───────────────────────── */}
      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Speech-to-Text</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                {['Provider', 'Per Minute', 'Real-time?', 'WER (avg)', 'TTFB', 'Best For'].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {STT_PROVIDERS.map((p, i) => (
                <tr key={p.name} className={i === 0 ? 'bg-blue-50/40' : ''}>
                  <td className="px-3 py-2 font-medium text-gray-800">{p.name}</td>
                  <td className="px-3 py-2 font-mono text-gray-700">${p.perMin.toFixed(4)}</td>
                  <td className="px-3 py-2">{p.streaming ? '✅ Yes' : '❌ No'}</td>
                  <td className="px-3 py-2 font-mono">{p.wer}</td>
                  <td className="px-3 py-2 font-mono text-gray-600">{p.latencyMs} ms</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{p.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── TTS Comparison ───────────────────────── */}
      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Text-to-Speech</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                {['Provider', 'Per 1k Chars', 'Streaming?', 'Quality', 'Latency', 'Best For'].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {TTS_PROVIDERS.map((p, i) => (
                <tr key={p.name} className={i === 0 ? 'bg-blue-50/40' : ''}>
                  <td className="px-3 py-2 font-medium text-gray-800">{p.name}</td>
                  <td className="px-3 py-2 font-mono text-gray-700">${p.perKChar.toFixed(3)}</td>
                  <td className="px-3 py-2">{p.streaming ? '✅ Yes' : '❌ No'}</td>
                  <td className="px-3 py-2">{p.quality}</td>
                  <td className="px-3 py-2 font-mono text-gray-600">{p.latencyMs} ms</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{p.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Cost Calculator ───────────────────────── */}
      <section className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase">Monthly Cost Calculator</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <label className="space-y-1">
              <span className="text-xs text-gray-500 font-medium">Minutes / month</span>
              <input
                type="number"
                value={minsPerMonth}
                min={0}
                onChange={e => setMinsPerMonth(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-gray-500 font-medium">AI responses / min</span>
              <input
                type="number"
                value={responsesPerMin}
                min={1}
                onChange={e => setResponsesPerMin(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-gray-500 font-medium">Avg chars / response</span>
              <input
                type="number"
                value={avgCharsPerResponse}
                min={10}
                onChange={e => setAvgCharsPerResponse(Math.max(10, parseInt(e.target.value) || 10))}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>
          </div>

          {/* Results */}
          <div className="grid grid-cols-2 gap-4">
            {/* Deepgram full-stack */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-blue-600 uppercase">Deepgram Stack</p>
              <p className="text-xs text-gray-600">STT (Nova-3): <strong>${sttCosts[0].cost}</strong></p>
              <p className="text-xs text-gray-600">TTS (Aura-2): <strong>${ttsCosts[0].cost}</strong></p>
              <p className="text-lg font-bold text-blue-900 border-t border-blue-200 pt-2 mt-2">
                Total: ${totalDeepgram.toFixed(2)}
              </p>
            </div>

            {/* Mixed stack */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase">OpenAI + ElevenLabs</p>
              <p className="text-xs text-gray-600">STT (Whisper): <strong>${sttCosts[1].cost}</strong></p>
              <p className="text-xs text-gray-600">TTS (ElevenLabs): <strong>${ttsCosts[1].cost}</strong></p>
              <p className="text-lg font-bold text-gray-800 border-t border-gray-200 pt-2 mt-2">
                Total: ${totalMixed.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-sm text-green-800">
              <strong>Deepgram saves ${(totalMixed - totalDeepgram).toFixed(2)}/month</strong>{' '}
              ({Math.round(((totalMixed - totalDeepgram) / totalMixed) * 100)}% cheaper)
              at this usage level.
            </p>
          </div>
        </div>
      </section>

      {/* ── Recommendation ───────────────────────── */}
      <section className="bg-slate-800 text-white rounded-xl p-5 space-y-2">
        <h3 className="font-bold text-lg">Recommendation</h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          For production real-time voice agents deployed on <strong>Vercel Edge</strong>,
          use <strong>Deepgram Nova-3</strong> for STT (lowest latency, real-time WebSocket streaming)
          and <strong>Deepgram Aura-2</strong> for TTS (fast response, 20× cheaper than ElevenLabs).
          Integrate using the <strong>Vercel AI SDK v6</strong> with tool calling for agentic workflows.
          Reserve ElevenLabs for premium use-cases where voice quality is the primary differentiator.
        </p>
      </section>
    </div>
  );
}
