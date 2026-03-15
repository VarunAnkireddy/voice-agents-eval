// src/components/FluxBenchmark.tsx
'use client';

import { useState, useRef } from 'react';

interface BenchmarkMetrics {
  ttfb: number | null;
  confidence: number | null;
  wordCount: number;
}

// STT Pricing per minute (as of 2025)
const STT_PRICING = [
  { label: 'Deepgram Nova-3', perMin: 0.0043, perHour: 0.258 },
  { label: 'OpenAI Whisper',  perMin: 0.006,  perHour: 0.360 },
];

export default function FluxBenchmark() {
  const [isRecording, setIsRecording]   = useState(false);
  const [transcript, setTranscript]     = useState('');
  const [metrics, setMetrics]           = useState<BenchmarkMetrics>({ ttfb: null, confidence: null, wordCount: 0 });
  const [status, setStatus]             = useState('');
  const [error, setError]               = useState<string | null>(null);
  const [sessionSecs, setSessionSecs]   = useState<number | null>(null);

  const socketRef       = useRef<WebSocket | null>(null);
  const recorderRef     = useRef<MediaRecorder | null>(null);
  const startTimeRef    = useRef<number | null>(null);
  const sessionStartRef = useRef<number | null>(null);

  const startBenchmark = async () => {
    setError(null);
    setTranscript('');
    setMetrics({ ttfb: null, confidence: null, wordCount: 0 });
    setSessionSecs(null);

    // 1. Microphone access
    setStatus('Requesting microphone…');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Microphone access denied.');
      setStatus('');
      return;
    }

    // 2. Fetch a short-lived API key from our secure server route
    setStatus('Fetching secure token…');
    let tempKey: string;
    try {
      const res = await fetch('/api/stt');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      tempKey = data.key;
      if (!tempKey) throw new Error('No key in response');
    } catch (e) {
      setError(`Token fetch failed: ${e instanceof Error ? e.message : String(e)}`);
      setStatus('');
      stream.getTracks().forEach(t => t.stop());
      return;
    }

    // 3. Open WebSocket to Deepgram Nova-3
    setStatus('Connecting to Deepgram Nova-3…');
    const url = 'wss://api.deepgram.com/v1/listen?model=nova-3&smart_format=true';
    const socket = new WebSocket(url, ['token', tempKey]);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus('Recording…');
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      recorderRef.current = recorder;
      sessionStartRef.current = performance.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && socket.readyState === WebSocket.OPEN) {
          if (!startTimeRef.current) startTimeRef.current = performance.now();
          socket.send(e.data);
        }
      };

      recorder.start(100); // 100 ms chunks → low-latency benchmark
      setIsRecording(true);
    };

    socket.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      const alt  = data.channel?.alternatives?.[0];
      if (!alt?.transcript) return;

      setMetrics(prev => ({
        ttfb:       prev.ttfb === null && startTimeRef.current
                      ? Math.round(performance.now() - startTimeRef.current)
                      : prev.ttfb,
        confidence: alt.confidence,
        wordCount:  prev.wordCount + alt.transcript.split(/\s+/).filter(Boolean).length,
      }));
      setTranscript(prev => `${prev} ${alt.transcript}`.trimStart());
    };

    socket.onerror  = () => { setError('WebSocket error.'); setStatus(''); };
    socket.onclose  = () => {
      setStatus('');
      if (sessionStartRef.current) {
        setSessionSecs(Math.round((performance.now() - sessionStartRef.current) / 1000));
        sessionStartRef.current = null;
      }
    };
  };

  const stopBenchmark = () => {
    recorderRef.current?.stop();
    socketRef.current?.close();
    setIsRecording(false);
    startTimeRef.current = null;
  };

  const sessionCost = sessionSecs && sessionSecs > 0
    ? STT_PRICING.map(p => ({ ...p, cost: ((sessionSecs / 60) * p.perMin).toFixed(5) }))
    : null;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-xl rounded-2xl border border-gray-100 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Deepgram Nova-3 STT Benchmark</h2>
          <p className="text-sm text-gray-400 mt-0.5">Week 1 · Latency, accuracy &amp; cost vs. OpenAI Whisper</p>
        </div>
        <button
          onClick={isRecording ? stopBenchmark : startBenchmark}
          className={`px-5 py-2 rounded-full font-semibold text-sm transition ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isRecording ? '⏹ Stop' : '▶ Start Benchmark'}
        </button>
      </div>

      {/* Status / Error */}
      {status && <p className="text-sm text-blue-500">{status}</p>}
      {error   && <p className="text-sm text-red-500">⚠ {error}</p>}

      {/* Live Metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Time to First Byte', value: metrics.ttfb != null ? `${metrics.ttfb} ms` : '--', color: 'blue' },
          { label: 'Confidence',         value: metrics.confidence != null ? `${(metrics.confidence * 100).toFixed(1)}%` : '--', color: 'green' },
          { label: 'Words Captured',     value: metrics.wordCount > 0 ? String(metrics.wordCount) : '--', color: 'purple' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`p-4 bg-${color}-50 rounded-xl border border-${color}-100 text-center`}>
            <p className={`text-xs uppercase text-${color}-600 font-bold mb-1`}>{label}</p>
            <p className={`text-2xl font-mono text-${color}-900`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Live Transcript */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 min-h-[110px]">
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Live Transcript</p>
        <p className="text-gray-700 leading-relaxed italic">
          {transcript || 'Speak into your microphone to start the benchmark…'}
        </p>
      </div>

      {/* Pricing Comparison Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase">STT Pricing Comparison (2025)</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-2 font-semibold text-gray-600">Provider</th>
              <th className="text-right px-4 py-2 font-semibold text-gray-600">Per Minute</th>
              <th className="text-right px-4 py-2 font-semibold text-gray-600">Per Hour</th>
              {sessionCost && <th className="text-right px-4 py-2 font-semibold text-gray-600">Session Cost</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {STT_PRICING.map((p, i) => (
              <tr key={p.label} className={i === 0 ? 'bg-blue-50/50' : ''}>
                <td className="px-4 py-2 font-medium text-gray-700">{p.label}</td>
                <td className="px-4 py-2 text-right font-mono text-gray-600">${p.perMin.toFixed(4)}</td>
                <td className="px-4 py-2 text-right font-mono text-gray-600">${p.perHour.toFixed(3)}</td>
                {sessionCost && (
                  <td className="px-4 py-2 text-right font-mono font-semibold text-gray-800">
                    ${sessionCost[i].cost}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {sessionCost && (
          <div className="bg-green-50 px-4 py-2 border-t border-green-100">
            <p className="text-xs text-green-700">
              Session duration: {sessionSecs}s ·{' '}
              Deepgram saves{' '}
              <strong>
                {(((parseFloat(sessionCost[1].cost) - parseFloat(sessionCost[0].cost)) /
                  parseFloat(sessionCost[1].cost)) * 100).toFixed(0)}%
              </strong>{' '}
              vs OpenAI Whisper
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
