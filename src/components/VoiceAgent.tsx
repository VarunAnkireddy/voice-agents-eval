// src/components/VoiceAgent.tsx
// Week 3: Agentic voice assistant – Vercel AI SDK v6 useChat + RAG + tool calls
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage, type DynamicToolUIPart, type TextUIPart } from 'ai';
import { useRef, useState, useEffect } from 'react';

const SUGGESTED_QUERIES = [
  'What is the pricing difference between Deepgram and OpenAI Whisper?',
  'How does RAG work?',
  'What tools does this agent have?',
  'Calculate the monthly cost at 10000 minutes for Deepgram Nova-3',
  "What's the weather in San Francisco?",
];

// Singleton transport pointed at /api/agent
const transport = new DefaultChatTransport({ api: '/api/agent' });

export default function VoiceAgent() {
  const { messages, sendMessage, status, stop } = useChat({ transport });

  const [inputText, setInputText] = useState('');
  const [sttActive, setSttActive] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const socketRef   = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const startRef    = useRef<number | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice input via Deepgram Nova-3 → fills the text input
  const startVoiceInput = async () => {
    setSttError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setSttError('Microphone access denied.');
      return;
    }

    let tempKey: string;
    try {
      const res = await fetch('/api/stt');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      tempKey = data.key;
    } catch (e) {
      setSttError(`Token fetch failed: ${e instanceof Error ? e.message : String(e)}`);
      stream.getTracks().forEach(t => t.stop());
      return;
    }

    const url = 'wss://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&interim_results=false';
    const socket = new WebSocket(url, ['token', tempKey]);
    socketRef.current = socket;

    socket.onopen = () => {
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      recorderRef.current = recorder;
      recorder.ondataavailable = e => {
        if (e.data.size > 0 && socket.readyState === WebSocket.OPEN) {
          if (!startRef.current) startRef.current = performance.now();
          socket.send(e.data);
        }
      };
      recorder.start(100);
      setSttActive(true);
    };

    socket.onmessage = msg => {
      const data = JSON.parse(msg.data);
      const transcript = data.channel?.alternatives?.[0]?.transcript;
      if (transcript) setInputText(transcript);
    };

    socket.onerror = () => setSttError('WebSocket error during voice input.');
    socket.onclose = () => { setSttActive(false); startRef.current = null; };
  };

  const stopVoiceInput = () => {
    recorderRef.current?.stop();
    socketRef.current?.close();
    setSttActive(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage({ text: inputText.trim() });
    setInputText('');
  };

  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-xl rounded-2xl border border-gray-100 flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Voice AI Agent</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Week 3 · Vercel AI SDK v6 · RAG knowledge retrieval · Function tool calls
        </p>
      </div>

      {/* Capability badges */}
      <div className="flex flex-wrap gap-2">
        {['RAG · Knowledge Search', 'Tool · Calculator', 'Tool · Weather', 'Multi-step reasoning'].map(badge => (
          <span key={badge} className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700 font-medium border border-purple-100">
            {badge}
          </span>
        ))}
      </div>

      {/* Suggested queries */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUERIES.map(q => (
          <button
            key={q}
            onClick={() => setInputText(q)}
            className="text-xs px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto max-h-[380px] space-y-3 pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 italic text-center py-8">
            Ask a question or click a suggestion above…
          </p>
        )}

        {(messages as UIMessage[]).map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm space-y-2 ${
                m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {m.parts.map((part, i) => {
                if (part.type === 'text') {
                  const textPart = part as TextUIPart;
                  return (
                    <p key={i} className="whitespace-pre-wrap leading-relaxed">
                      {textPart.text}
                    </p>
                  );
                }

                if (part.type === 'dynamic-tool') {
                  const toolPart = part as DynamicToolUIPart;
                  return (
                    <div
                      key={i}
                      className="text-xs bg-white/20 rounded-lg px-2 py-1.5 border border-white/30"
                    >
                      <span className="font-bold">⚙ {toolPart.toolName}</span>
                      {toolPart.state !== 'input-streaming' && toolPart.input !== undefined && (
                        <span className="ml-2 opacity-75">
                          {JSON.stringify(toolPart.input).slice(0, 80)}
                        </span>
                      )}
                      {(toolPart.state === 'output-available' || toolPart.state === 'output-error') && (
                        <div className="mt-1 opacity-90">
                          {toolPart.state === 'output-available'
                            ? `↳ ${JSON.stringify(toolPart.output).slice(0, 120)}`
                            : `↳ Error: ${toolPart.errorText}`}
                        </div>
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2.5">
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* STT error */}
      {sttError && <p className="text-xs text-red-500">⚠ {sttError}</p>}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Type a question or use voice input…"
          disabled={isLoading}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={sttActive ? stopVoiceInput : startVoiceInput}
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition ${
            sttActive
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
          title={sttActive ? 'Stop voice input' : 'Start voice input'}
        >
          🎙
        </button>
        {isLoading ? (
          <button
            type="button"
            onClick={stop}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-full transition"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition disabled:opacity-50"
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}
