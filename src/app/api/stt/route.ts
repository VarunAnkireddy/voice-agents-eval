import { createClient } from "@deepgram/sdk";
import { NextResponse } from "next/server";

export async function GET() {
  // 1. Initialize the Deepgram Client
  const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

  // 2. Request a temporary project key for client-side streaming
  // This is safer than exposing your master key to the browser
  const { result, error } = await deepgram.manage.createProjectKey(
    process.env.DEEPGRAM_PROJECT_ID!,
    {
      comment: "Temporary key for Week 1 STT Benchmark",
      scopes: ["usage:write"],
      tags: ["nextjs-voice-eval"],
      time_to_live_in_seconds: 60,
    }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(result);
}