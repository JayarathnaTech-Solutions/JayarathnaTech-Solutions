import { SITE_NAME, SITE_URL, siteContact } from '../src/lib/siteInfo'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const MAX_HISTORY_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 2000

const SYSTEM_INSTRUCTION = `You are the website assistant for ${SITE_NAME} (${SITE_URL}), a software company based in ${siteContact.location} building web applications, e-commerce platforms, mobile apps, and custom software for clients in Sri Lanka and internationally.

Only answer questions related to ${SITE_NAME}: its services, process, pricing approach, portfolio, or how to get in touch. If asked something unrelated (general knowledge, coding help unrelated to hiring us, other companies, etc.), politely say that's outside what you can help with here and steer back to how ${SITE_NAME} can help. Keep answers concise — a few sentences unless the visitor asks for detail. Never invent facts, prices, or timelines you're not given below; when unsure or asked for an exact quote, direct the visitor to the Contact page.

Whenever you reference one of this site's own pages (Contact, Services, About, Projects), format it as a markdown link using the exact URLs below, e.g. [Contact page](${SITE_URL}/contact) — the chat widget renders these as clickable links.

SERVICES OFFERED:
- Custom Web Development — high-performance websites and web applications tailored to exact business needs.
- E-Commerce Solutions — secure, scalable online stores that turn visitors into paying customers.
- Mobile App Development — cross-platform apps that deliver seamless experiences on any device.
- UI/UX Design — interfaces designed around users and conversion.
- SaaS Development — multi-tenant software products built to scale from first user to enterprise.
- Maintenance & Support — ongoing monitoring, updates, and support after launch.

ENGAGEMENT MODELS:
- Fixed-Price Projects — clear scope, timeline, and budget agreed upfront.
- Dedicated Team — a committed team working exclusively on the client's product, scaling as needed.
- Time & Material — flexible, pay-as-you-go for evolving requirements.

WHY CLIENTS CHOOSE US:
- Faster time-to-market through streamlined development.
- Scalable-by-design architecture that grows with the business.
- End-to-end ownership from first sketch to production deployment.
- Transparent pricing with no hidden fees or scope creep.

COMMON QUESTIONS:
- Typical project timeline: most web projects launch within 4-8 weeks; larger platforms may take longer. Exact estimates come after understanding requirements.
- Post-launch support: every project includes a warranty period, plus ongoing maintenance/support plans are available.
- Tech stack: specializes in React, Vue, Laravel, Spring, and cloud platforms like AWS and Firebase, but can adapt to a client's existing stack.
- Communication: clients get a single point of contact and regular progress updates.
- Changing requirements: the team works iteratively, so scope changes are handled transparently with impact discussed before any change.

CONTACT:
- Email: ${siteContact.email}
- Phone: ${siteContact.phone}
- Location: ${siteContact.location}
- Contact page: ${SITE_URL}/contact
- For quotes or to start a project, direct visitors to the Contact page.

SITE PAGES:
- Contact: ${SITE_URL}/contact
- Services: ${SITE_URL}/services
- About: ${SITE_URL}/about
- Projects (portfolio): ${SITE_URL}/projects`

export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

export interface ChatResult {
  status: number
  body: { reply?: string; error?: string }
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    (candidate.role === 'user' || candidate.role === 'model') &&
    typeof candidate.text === 'string' &&
    candidate.text.length > 0 &&
    candidate.text.length <= MAX_MESSAGE_LENGTH
  )
}

export async function handleChatRequest(apiKey: string | undefined, rawMessages: unknown): Promise<ChatResult> {
  if (!apiKey) {
    return { status: 500, body: { error: 'Chat is not configured.' } }
  }

  if (!Array.isArray(rawMessages) || rawMessages.length === 0 || !rawMessages.every(isChatMessage)) {
    return { status: 400, body: { error: 'messages must be a non-empty array of { role, text }' } }
  }

  const contents = (rawMessages as ChatMessage[]).slice(-MAX_HISTORY_MESSAGES).map((message) => ({
    role: message.role,
    parts: [{ text: message.text }],
  }))

  const geminiResponse = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { role: 'system', parts: [{ text: SYSTEM_INSTRUCTION }] },
      generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
    }),
  })

  if (!geminiResponse.ok) {
    console.error('Gemini API error', geminiResponse.status, await geminiResponse.text())
    return { status: 502, body: { error: 'The assistant is temporarily unavailable. Please try again shortly.' } }
  }

  const data = (await geminiResponse.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()

  return { status: 200, body: { reply: reply || "Sorry, I couldn't come up with a response — please try rephrasing." } }
}
