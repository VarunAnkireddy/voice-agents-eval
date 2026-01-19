// src/components/FluxBenchmark.tsx
'use client';

import { useState, useRef, useCallback } from 'react';

interface BenchmarkMetrics {
  startTime: number | null;
  ttfb: number | null;
  confidence: number | null;
}

export default function FluxBenchmark() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [metrics, setMetrics] = useState<BenchmarkMetrics>({
    startTime: null,
    ttfb: null,
    confidence: null,
  });

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startBenchmark = async () => {

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

    setTranscript('');
    setMetrics({ startTime: null, ttfb: null, confidence: null });

    // 1. Setup WebSocket for Flux Model
    // Note: In production, generate a temp key via your /api/stt route
    const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    const url = 'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true';
    
    const socket = new WebSocket(url, ['token', apiKey!]);
    socketRef.current = socket;

    socket.onopen = async () => {
      console.log('Connected to Deepgram Flux v2');
      
      // 2. Start Microphone
      // const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket.readyState === 1) {
          // Record the exact moment the first byte of audio is sent
          if (!metrics.startTime) {
            setMetrics(prev => ({ ...prev, startTime: performance.now() }));
          }
          socket.send(event.data);
        }
      };

      // Send small chunks (100ms) for ultra-low latency benchmarking
      recorder.start(100);
      setIsRecording(true);
    };

    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      const result = data.channel?.alternatives[0];

      if (result?.transcript) {
        // 3. Calculate TTFB on the very first transcript received
        setMetrics((prev) => {
          if (prev.startTime && prev.ttfb === null) {
            const now = performance.now();
            return {
              ...prev,
              ttfb: Math.round(now - prev.startTime),
              confidence: result.confidence,
            };
          }
          return { ...prev, confidence: result.confidence };
        });

        setTranscript((prev) => prev + ' ' + result.transcript);
      }
    };

    socket.onerror = (err) => {
    console.error("🔴 Socket Error:", err);
  };
  socket.onclose = (event) => {
    console.log(`🟡 Socket Closed. Code: ${event.code}, Reason: ${event.reason}`);
  };
  };

  const stopBenchmark = () => {
    mediaRecorderRef.current?.stop();
    socketRef.current?.close();
    setIsRecording(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-xl rounded-2xl border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Flux STT Benchmark</h2>
        <button
          onClick={isRecording ? stopBenchmark : startBenchmark}
          className={`px-6 py-2 rounded-full font-semibold transition ${
            isRecording ? 'bg-red-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRecording ? 'Stop Recording' : 'Start Benchmark'}
        </button>
      </div>

      {/* Latency Dashboard */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
          <p className="text-xs uppercase text-blue-600 font-bold mb-1">Time to First Byte</p>
          <p className="text-3xl font-mono text-blue-900">
            {metrics.ttfb ? `${metrics.ttfb}ms` : '--'}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
          <p className="text-xs uppercase text-green-600 font-bold mb-1">Confidence Score</p>
          <p className="text-3xl font-mono text-green-900">
            {metrics.confidence ? `${(metrics.confidence * 100).toFixed(1)}%` : '--'}
          </p>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 min-h-[150px]">
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Live Transcript</p>
        <p className="text-gray-700 leading-relaxed italic">
          {transcript || "Speak into your microphone to see results..."}
        </p>
      </div>
    </div>
  );
}