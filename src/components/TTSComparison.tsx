// src/components/TTSComparison.tsx
// Week 2: TTS Comparison – Deepgram Aura-2 vs ElevenLabs
'use client';

import { useState, useRef } from 'react';

interface TTSResult {
  provider: string;
  ttfbMs: number | null;
  audioUrl: string | null;
  error: string | null;
  loading: boolean;
}

const DEFAULT_TEXT =
  'Welcome to the voice AI evaluation platform. This benchmark compares ' +
  'Deepgram Aura and ElevenLabs text-to-speech quality and latency.';

const PROVIDERS = [
  {
    id: 'deepgram',
    label: 'Deepgram Aura-2',
    subtitle: 'Thalia · Fast & cost-effective',
    endpoint: '/api/tts/deepgram',
    color: 'blue',
    pricing: '$0.015 / 1k chars',
  },
  {
    id: 'elevenlabs',
    label: 'ElevenLabs',
    subtitle: 'Adam ·Free tier available',
    endpoint: '/api/tts/elevenlabs',
    color: 'violet',
    pricing: '$0.30 / 1k chars',
  },
];

function empty(): TTSResult {
  return { provider: '', ttfbMs: null, audioUrl: null, error: null, loading: false };
}

export default function TTSComparison() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [results, setResults] = useState<Record<string, TTSResult>>({
    deepgram: empty(),
    elevenlabs: empty(),
  });

  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({ deepgram: null, elevenlabs: null });

  const synthesise = async (providerId: string, endpoint: string) => {
    // Reset previous result and revoke old blob URL
    setResults(prev => {
      if (prev[providerId].audioUrl) URL.revokeObjectURL(prev[providerId].audioUrl!);
      return { ...prev, [providerId]: { ...empty(), loading: true, provider: providerId } };
    });

    try {
      const startMs = Date.now();
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const ttfbMs = Date.now() - startMs;

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const serverTtfb = res.headers.get('X-TTFB-Ms');

      setResults(prev => ({
        ...prev,
        [providerId]: {
          provider: providerId,
          ttfbMs: serverTtfb ? parseInt(serverTtfb, 10) : ttfbMs,
          audioUrl,
          error: null,
          loading: false,
        },
      }));

      // Auto-play
      setTimeout(() => audioRefs.current[providerId]?.play(), 50);
    } catch (e) {
      setResults(prev => ({
        ...prev,
        [providerId]: {
          ...empty(),
          error: e instanceof Error ? e.message : String(e),
          loading: false,
        },
      }));
    }
  };

  const synthesiseAll = () => {
    PROVIDERS.forEach(p => synthesise(p.id, p.endpoint));
  };

  const charCount = text.length;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-xl rounded-2xl border border-gray-100 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">TTS Provider Comparison</h2>
        <p className="text-sm text-gray-400 mt-0.5">Week 2 · Deepgram Aura-2 vs ElevenLabs quality &amp; latency</p>
      </div>

      {/* Text Input */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
          Text to Synthesise
        </label>
        <textarea
          rows={3}
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-800 bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{charCount} characters</p>
      </div>

      {/* Synthesise Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={synthesiseAll}
          className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-full transition"
        >
          ▶ Compare Both
        </button>
        {PROVIDERS.map(p => (
          <button
            key={p.id}
            onClick={() => synthesise(p.id, p.endpoint)}
            className={`px-4 py-2 bg-${p.color}-100 hover:bg-${p.color}-200 text-${p.color}-800 text-sm font-medium rounded-full transition`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PROVIDERS.map(p => {
          const r = results[p.id];
          return (
            <div
              key={p.id}
              className={`p-4 border rounded-xl space-y-3 ${
                r.loading ? 'border-gray-200 bg-gray-50 animate-pulse' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{p.label}</p>
                  <p className="text-xs text-gray-400">{p.subtitle}</p>
                </div>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full bg-${p.color}-50 text-${p.color}-700`}>
                  {p.pricing}
                </span>
              </div>

              {r.loading && (
                <p className="text-xs text-gray-400 italic">Generating…</p>
              )}

              {r.error && (
                <p className="text-xs text-red-500">⚠ {r.error}</p>
              )}

              {r.ttfbMs != null && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Latency:</span>
                  <span className={`text-sm font-mono font-bold text-${p.color}-700`}>{r.ttfbMs} ms</span>
                </div>
              )}

              {r.audioUrl && (
                <audio
                  ref={el => { audioRefs.current[p.id] = el; }}
                  controls
                  src={r.audioUrl}
                  className="w-full h-8"
                />
              )}

              {!r.loading && !r.error && !r.audioUrl && (
                <p className="text-xs text-gray-300 italic">No audio yet</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Side-by-side latency summary */}
      {results.deepgram.ttfbMs != null && results.elevenlabs.ttfbMs != null && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Latency Summary</p>
          <div className="flex gap-6 text-sm">
            <span>Deepgram: <strong>{results.deepgram.ttfbMs} ms</strong></span>
            <span>ElevenLabs: <strong>{results.elevenlabs.ttfbMs} ms</strong></span>
            <span className="text-green-600">
              Deepgram is{' '}
              <strong>
                {Math.round(
                  ((results.elevenlabs.ttfbMs - results.deepgram.ttfbMs) /
                    results.elevenlabs.ttfbMs) *
                    100
                )}%
              </strong>{' '}
              faster
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
