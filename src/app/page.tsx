// src/app/page.tsx
import FluxBenchmark from '@/components/FluxBenchmark';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Voice AI Evaluation
          </h1>
          <p className="text-slate-500 text-lg">
            Week 1: Benchmarking Deepgram Flux STT Latency
          </p>
        </header>

        {/* The Core Benchmark Component */}
        <section className="bg-slate-50 p-1 rounded-3xl border border-slate-200">
          <FluxBenchmark/>
        </section>

        {/* Progress Footer */}
        <footer className="pt-8 border-t border-slate-100 flex justify-between text-sm text-slate-400">
          <p>Project: Agentic Voice Platform</p>
          <p>Deliverable: Phase 1 (Initial Setup)</p>
        </footer>
      </div>
    </main>
  );
}