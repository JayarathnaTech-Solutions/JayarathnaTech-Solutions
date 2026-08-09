// No file extension here on purpose: Vercel's Edge Function bundler (see
// api/quoteAi.ts's `runtime: 'edge'`) fails to resolve relative imports that
// have one, even though Vite's native config loader warns about it.
import { SITE_NAME } from '../src/lib/siteInfo'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const MAX_INPUT_LENGTH = 4000

const SYSTEM_INSTRUCTION = `You turn raw, messy notes collected from a client into a clean, professional "Project Requirements" summary for a ${SITE_NAME} quote document.

Rewrite the input into well-structured prose and/or short bullet points covering the client's goals, key features, and any constraints mentioned. Keep all facts, numbers, and specifics from the input — never invent requirements that weren't mentioned. Do not add pricing, timelines, or anything not present in the input. Do not add a title or heading. Keep it concise and client-appropriate — plain text output only, no markdown formatting.`

export interface QuoteAiResult {
  status: number
  body: { result?: string; error?: string }
}

export async function handleQuoteAiRequest(apiKey: string | undefined, rawNotes: unknown): Promise<QuoteAiResult> {
  if (!apiKey) {
    return { status: 500, body: { error: 'AI beautify is not configured.' } }
  }

  if (typeof rawNotes !== 'string' || rawNotes.trim().length === 0) {
    return { status: 400, body: { error: 'notes must be a non-empty string' } }
  }

  if (rawNotes.length > MAX_INPUT_LENGTH) {
    return { status: 400, body: { error: `notes must be ${MAX_INPUT_LENGTH} characters or fewer` } }
  }

  const geminiResponse = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: rawNotes }] }],
      systemInstruction: { role: 'system', parts: [{ text: SYSTEM_INSTRUCTION }] },
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
    }),
  })

  if (!geminiResponse.ok) {
    console.error('Gemini API error', geminiResponse.status, await geminiResponse.text())
    return { status: 502, body: { error: 'AI beautify is temporarily unavailable. Please try again shortly.' } }
  }

  const data = (await geminiResponse.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const result = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()

  return { status: 200, body: { result: result || undefined } }
}
