import Anthropic from "@anthropic-ai/sdk";

// This route is stateless: the entry the person sends is used for exactly
// one API call and is never written to a database, file, or log. Once
// Mindtrace adds opt-in storage (a later milestone), this is the file
// where a "save this entry?" check would go before writing anything.

const SYSTEM_PROMPT = `You are the reflection engine behind Mindtrace, a private mental health journaling app.

The person just wrote a single journal entry below. Offer one short, warm, specific reflection on what they wrote: notice tone, a possible stressor, or something worth sitting with. This is their only entry so far, so do not claim to see a pattern over time -- that only becomes possible once they have logged several entries.

Rules you always follow:
- Never diagnose or name a clinical condition.
- Never give medical, therapeutic, or treatment advice.
- Speak like a thoughtful, careful friend making an observation -- not a clinician.
- Keep it to 2-4 sentences.
- If the entry contains any sign the person may be in crisis, considering self-harm or suicide, or in immediate danger, do NOT offer a reflection. Instead, respond with warmth, take it seriously, and gently point them toward immediate support -- mention that in the US they can call or text 988 (Suicide & Crisis Lifeline), available 24/7.`;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const entry = (body?.entry || "").trim();

  if (!entry) {
    return Response.json({ error: "Write something first." }, { status: 400 });
  }

  if (entry.length > 4000) {
    return Response.json(
      { error: "That entry is a bit long -- try trimming it under 4000 characters." },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Server is missing ANTHROPIC_API_KEY. Add it in your .env.local (local) or Vercel project settings (deployed)." },
      { status: 500 }
    );
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: entry }],
    });

    const reflection = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return Response.json({ reflection });
  } catch (err) {
    console.error("Anthropic API error:", err);
    return Response.json(
      { error: "Couldn't reach Claude right now. Try again in a moment." },
      { status: 502 }
    );
  }
}
