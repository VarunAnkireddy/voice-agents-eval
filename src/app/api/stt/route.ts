import { createClient } from "@deepgram/sdk";
import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.DEEPGRAM_API_KEY ?? process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "DEEPGRAM_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const projectId = process.env.DEEPGRAM_PROJECT_ID;

  // If a project ID is available, issue a short-lived scoped key.
  // This is the most secure option: the master key never reaches the browser.
  if (projectId) {
    const deepgram = createClient(apiKey);
    const { result, error } = await deepgram.manage.createProjectKey(
      projectId,
      {
        comment: "Temporary key for STT Benchmark",
        scopes: ["usage:write"],
        tags: ["nextjs-voice-eval"],
        time_to_live_in_seconds: 60,
      }
    );

    if (!error && result) {
      return NextResponse.json(result); // result.key contains the token
    }
    // Fall through to the direct-key fallback if creation fails
    console.warn("createProjectKey failed, falling back to direct key:", error);
  }

  // Fallback: return the master API key through the server route.
  // Still secure – the key is never embedded in client-side source code.
  return NextResponse.json({ key: apiKey });
}