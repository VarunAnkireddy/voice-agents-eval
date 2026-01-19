'use client';

import { useState, useRef } from 'react';

export default function VoiceBenchmark() {
  const [status, setStatus] = useState('Idle');
  const [transcript, setTranscript] = useState('');
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  const startPrototyping = async () => {
    setStatus('Connecting to Deepgram Flux...');
    
    // 1. Get browser microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);

    // 2. Setup WebSocket (Simplified for Week 1 Benchmark)
    const socket = new WebSocket('wss://api.deepgram.com/v1/listen?model=flux-general-en', [
      'token',
      process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY!,
    ]);

    socket.onopen = () => {
      setStatus('Recording - Flux Model Active');
      mediaRecorder.current?.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0 && socket.readyState === 1) {
          socket.send(event.data);
        }
      });
      mediaRecorder.current?.start(100); // Send audio chunks every 100ms
    };

    socket.onmessage = (message) => {
      const received = JSON.parse(message.data);
      const text = received.channel?.alternatives[0]?.transcript;
      if (text) setTranscript((prev) => prev + ' ' + text);
    };
  };

  return (
    <div className="p-8 border rounded-lg">
      <h2 className="text-xl font-bold">Week 1: STT Flux Benchmark</h2>
      <p className="mt-2 text-sm text-gray-600">Status: {status}</p>
      <button 
        onClick={startPrototyping}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Start Voice Loop
      </button>
      <div className="mt-6 p-4 bg-gray-100 rounded min-h-[100px]">
        <strong>Transcript:</strong> {transcript}
      </div>
    </div>
  );
}