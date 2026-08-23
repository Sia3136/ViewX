import { NextResponse } from "next/server";

// Simple in-memory cache to prevent re-generating explanations for the same alert
const explanationCache = new Map<string, string>();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      alertId,
      type,
      severity,
      confidence,
      studentId,
      room,
      description,
    } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: "alertId is required" },
        { status: 400 }
      );
    }

    // Check if we already have an explanation for this alert
    if (explanationCache.has(alertId.toString())) {
      return NextResponse.json({
        alertId,
        explanation: explanationCache.get(alertId.toString()),
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are an AI assistant analyzing exam surveillance alerts. Explain what happened in human terms, why it is suspicious, and how confident we are based on the numerical details. Keep it concise.",
            },
            {
              role: "user",
              content: `Alert Details:
Type: ${type}
Severity: ${severity}
Confidence: ${confidence}%
Person: ${studentId}
Room: ${room}
Description: ${description || "N/A"}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Groq request failed",
        },
        { status: response.status }
      );
    }

    const explanation =
      data.choices?.[0]?.message?.content ||
      "No explanation provided.";

    // Store in cache
    explanationCache.set(alertId.toString(), explanation);

    return NextResponse.json({
      alertId,
      explanation,
    });
  } catch (error) {
    console.error("Groq explanation error:", error);

    return NextResponse.json(
      { error: "Failed to generate AI explanation" },
      { status: 500 }
    );
  }
}
