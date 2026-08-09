// No file extension here on purpose: Vercel's Edge Function bundler (see
// api/requirementsDocAi.ts's `runtime: 'edge'`) fails to resolve relative
// imports that have one, even though Vite's native config loader warns about it.
import { SITE_NAME } from '../src/lib/siteInfo'

const GEMINI_MODEL = 'gemini-3.1-flash-lite'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const MAX_INPUT_LENGTH = 4000
const MAX_OUTPUT_TOKENS = 8192
const MAX_DIAGRAM_OUTPUT_TOKENS = 4096

const COMMON_RULES = `Write like a senior business analyst / solutions architect at a top-tier software consultancy producing a client-ready, professional-grade document — not a bare restatement of the client's notes.

Two kinds of sections need different treatment:
- Project-specific sections (scope, business/functional requirements, stakeholders): stick to what the client's notes actually describe. Don't invent specific features, pages, integrations, or client-specific facts that weren't mentioned.
- Standard sections every professional BRD/SRS includes regardless of what the client spelled out — Assumptions & Constraints, Non-Functional Requirements, System Constraints: NEVER write "not specified" or leave these thin. Apply sound, industry-standard defaults appropriate to the type of project described, the way an experienced analyst would when scoping any similar project. For a web project, for example: responsive design across desktop/tablet/mobile, current-version support for major browsers, reasonable page-load performance targets, HTTPS and standard data-handling practices, the client providing final content/copy/images, standard hosting/domain assumptions, and a defined warranty/support period. Adapt these to what's actually being built rather than listing everything by rote.

Plain text only — no markdown symbols (no #, *, **, -). Use section titles in capitals on their own line, blank lines between sections, and plain numbered lines (e.g. "1. ...") for lists. Output only the document itself, no preamble or closing remarks.`

const BRD_INSTRUCTION = `You are a senior business analyst at ${SITE_NAME}. A quote has just been accepted by a client, and you're given the client's requirements notes. Turn them into a polished, professional Business Requirements Document (BRD) of the standard a top-rated software company would hand a client.

Cover these sections, in order: PROJECT OVERVIEW, BUSINESS OBJECTIVES, SCOPE, STAKEHOLDERS, KEY BUSINESS REQUIREMENTS, ASSUMPTIONS & CONSTRAINTS.

${COMMON_RULES}`

const SRS_INSTRUCTION = `You are a senior solutions architect at ${SITE_NAME}. A quote has just been accepted by a client, and you're given the client's requirements notes. Turn them into a polished, professional Software Requirements Specification (SRS) of the standard a top-rated software company would hand a client.

Cover these sections, in order: INTRODUCTION & PURPOSE, SCOPE, FUNCTIONAL REQUIREMENTS (numbered list), NON-FUNCTIONAL REQUIREMENTS, SYSTEM CONSTRAINTS.

${COMMON_RULES}`

const DIAGRAM_COMMON_RULES = `Output ONLY raw Mermaid diagram syntax — no markdown code fences (no \`\`\`), no explanation, no preamble, no text before or after the diagram definition. Keep node labels short (2-5 words). Only represent components, roles, integrations, and data actually implied by the project context given — don't invent specific named third-party services that weren't mentioned, but you may use standard generic layers/roles a project of this type would need.`

const ARCHITECTURE_INSTRUCTION = `You are a senior solutions architect at ${SITE_NAME}. Given the project context below, produce a High-Level System Architecture diagram as Mermaid syntax.

Use "flowchart TD". Show the major layers/components (e.g. client/frontend, backend/API, database, authentication, any external integrations mentioned in the context) grouped with subgraphs where it helps clarity. The output must start directly with "flowchart TD".

${DIAGRAM_COMMON_RULES}`

const WORKFLOW_INSTRUCTION = `You are a senior business analyst at ${SITE_NAME}. Given the project context below, produce a Process / Workflow flow chart as Mermaid syntax, showing the main user journey or process flow through the system.

Use "flowchart TD" with a clear start and end node, and decision diamonds where the process branches. The output must start directly with "flowchart TD".

${DIAGRAM_COMMON_RULES}`

const DFD_INSTRUCTION = `You are a senior solutions architect at ${SITE_NAME}. Given the project context below, produce a Level-1 Data Flow Diagram (DFD) as Mermaid syntax.

Use "flowchart LR". Represent external entities as stadium shapes like Name([Name]), processes as rounded rectangles like Name(Name), and data stores as cylinder shapes like Name[(Name)]. Label each arrow with the data that flows along it, e.g. A -->|Submits order| B. The output must start directly with "flowchart LR".

${DIAGRAM_COMMON_RULES}`

export interface RequirementsDocContext {
  techStack?: string
  userRoles?: string
  externalIntegrations?: string
  dataEntities?: string
}

export interface RequirementsDocAiResult {
  status: number
  body: {
    brd?: string
    srs?: string
    architectureDiagram?: string
    workflowDiagram?: string
    dfdDiagram?: string
    error?: string
  }
}

async function callGemini(
  apiKey: string,
  systemInstruction: string,
  input: string,
  maxOutputTokens: number,
  quotaState: { exceeded: boolean },
): Promise<string | undefined> {
  const geminiResponse = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: input }] }],
      systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
      generationConfig: { temperature: 0.4, maxOutputTokens },
    }),
  })

  if (!geminiResponse.ok) {
    console.error('Gemini API error', geminiResponse.status, await geminiResponse.text())
    if (geminiResponse.status === 429) quotaState.exceeded = true
    return undefined
  }

  const data = (await geminiResponse.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
  }
  const candidate = data.candidates?.[0]
  if (candidate?.finishReason === 'MAX_TOKENS') {
    console.error('Gemini response truncated by MAX_TOKENS')
    return undefined
  }

  const text = candidate?.content?.parts?.map((part) => part.text ?? '').join('').trim()
  return text || undefined
}

async function generateDoc(
  apiKey: string,
  systemInstruction: string,
  notes: string,
  quotaState: { exceeded: boolean },
): Promise<string | undefined> {
  return callGemini(apiKey, systemInstruction, notes, MAX_OUTPUT_TOKENS, quotaState)
}

// Models often wrap "code-only" output in ```mermaid fences despite being told
// not to — strip them defensively rather than fail the whole generation.
function stripCodeFences(text: string): string {
  return text
    .replace(/^```[a-zA-Z]*\n?/, '')
    .replace(/```\s*$/, '')
    .trim()
}

async function generateDiagram(
  apiKey: string,
  systemInstruction: string,
  context: string,
  quotaState: { exceeded: boolean },
): Promise<string | undefined> {
  const raw = await callGemini(apiKey, systemInstruction, context, MAX_DIAGRAM_OUTPUT_TOKENS, quotaState)
  return raw ? stripCodeFences(raw) : undefined
}

function buildDiagramContext(notes: string, context: RequirementsDocContext): string {
  const parts = [`PROJECT REQUIREMENTS:\n${notes}`]
  if (context.techStack?.trim()) parts.push(`TECH STACK:\n${context.techStack.trim()}`)
  if (context.userRoles?.trim()) parts.push(`USER ROLES:\n${context.userRoles.trim()}`)
  if (context.externalIntegrations?.trim()) parts.push(`EXTERNAL INTEGRATIONS:\n${context.externalIntegrations.trim()}`)
  if (context.dataEntities?.trim()) parts.push(`KEY DATA ENTITIES:\n${context.dataEntities.trim()}`)
  return parts.join('\n\n')
}

export async function handleRequirementsDocAiRequest(
  apiKey: string | undefined,
  rawNotes: unknown,
  rawContext: unknown,
): Promise<RequirementsDocAiResult> {
  if (!apiKey) {
    return { status: 500, body: { error: 'AI document generation is not configured.' } }
  }

  if (typeof rawNotes !== 'string' || rawNotes.trim().length === 0) {
    return { status: 400, body: { error: 'notes must be a non-empty string' } }
  }

  if (rawNotes.length > MAX_INPUT_LENGTH) {
    return { status: 400, body: { error: `notes must be ${MAX_INPUT_LENGTH} characters or fewer` } }
  }

  const context: RequirementsDocContext =
    rawContext && typeof rawContext === 'object' ? (rawContext as RequirementsDocContext) : {}
  const diagramContext = buildDiagramContext(rawNotes, context)
  const quotaState = { exceeded: false }

  const [brd, srs, architectureDiagram, workflowDiagram, dfdDiagram] = await Promise.all([
    generateDoc(apiKey, BRD_INSTRUCTION, rawNotes, quotaState),
    generateDoc(apiKey, SRS_INSTRUCTION, rawNotes, quotaState),
    generateDiagram(apiKey, ARCHITECTURE_INSTRUCTION, diagramContext, quotaState),
    generateDiagram(apiKey, WORKFLOW_INSTRUCTION, diagramContext, quotaState),
    generateDiagram(apiKey, DFD_INSTRUCTION, diagramContext, quotaState),
  ])

  if (!brd || !srs) {
    if (quotaState.exceeded) {
      return { status: 429, body: { error: "We've hit today's AI usage limit. Please try again later." } }
    }
    return { status: 502, body: { error: "Couldn't generate the documents — please try again." } }
  }

  return { status: 200, body: { brd, srs, architectureDiagram, workflowDiagram, dfdDiagram } }
}
