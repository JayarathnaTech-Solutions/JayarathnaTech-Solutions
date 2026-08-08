import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { SITE_NAME, SITE_URL } from '../lib/siteInfo'
import { createContactMessage } from '../lib/firestore'

interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'model',
  text: `Hello, and welcome to ${SITE_NAME}. I'm happy to answer questions about our services, process, pricing approach, or how to get in touch — how can I help?`,
}

const AUTO_OPEN_DELAY_MS = 4000
const AUTO_OPEN_SESSION_KEY = 'jt-chat-auto-opened'

type LeadCardState = 'hidden' | 'visible' | 'submitting' | 'submitted'

const LEAD_PROMPT_AFTER_MESSAGES = 2
const LEAD_CAPTURED_SESSION_KEY = 'jt-chat-lead-captured'
const LEAD_DISMISSED_SESSION_KEY = 'jt-chat-lead-dismissed'

// Short two-tone chime synthesized in-browser, so opening the assistant
// doesn't depend on shipping/loading an audio file.
let sharedAudioContext: AudioContext | null = null
let chimePending = false

function getAudioContext(): AudioContext | null {
  if (sharedAudioContext) return sharedAudioContext
  const AudioContextClass =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return null
  sharedAudioContext = new AudioContextClass()
  return sharedAudioContext
}

function playChimeTones(ctx: AudioContext) {
  const now = ctx.currentTime
  const playTone = (frequency: number, start: number, duration: number) => {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0, now + start)
    gain.gain.linearRampToValueAtTime(0.15, now + start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(now + start)
    oscillator.stop(now + start + duration)
  }
  playTone(740, 0, 0.18)
  playTone(988, 0.12, 0.22)
}

// Browsers block audio playback until the visitor has interacted with the
// page at least once (click, keypress, tap) — a timer-triggered sound alone
// gets silently blocked. If that happens, queue it; the page-wide listener
// registered in the component below plays it on the visitor's first
// interaction instead of losing it entirely.
function requestChime() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      chimePending = true
      return
    }
    playChimeTones(ctx)
  } catch {
    // Audio is a nice-to-have — never let it break the chat experience.
  }
}

const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)]+)\)/g

// Renders markdown-style [label](url) links from the model's reply as
// clickable links — same-origin ones navigate client-side via react-router
// so they don't blow away the chat panel with a full page reload.
function renderMessageText(text: string) {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  MARKDOWN_LINK.lastIndex = 0
  while ((match = MARKDOWN_LINK.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    const [, label, href] = match
    const linkClassName = 'underline decoration-current underline-offset-2 hover:opacity-80'

    if (href.startsWith('/') || href.startsWith(SITE_URL)) {
      const to = href.startsWith(SITE_URL) ? href.slice(SITE_URL.length) || '/' : href
      nodes.push(
        <Link key={key++} to={to} className={linkClassName}>
          {label}
        </Link>,
      )
    } else {
      nodes.push(
        <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
          {label}
        </a>,
      )
    }
    lastIndex = MARKDOWN_LINK.lastIndex
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))

  return nodes
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasInteractedRef = useRef(false)

  const [leadCardState, setLeadCardState] = useState<LeadCardState>('hidden')
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadError, setLeadError] = useState<string | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isSending])

  useEffect(() => {
    if (sessionStorage.getItem(AUTO_OPEN_SESSION_KEY)) return
    const timer = setTimeout(() => {
      sessionStorage.setItem(AUTO_OPEN_SESSION_KEY, 'true')
      if (hasInteractedRef.current) return
      setIsOpen(true)
      requestChime()
    }, AUTO_OPEN_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  // Plays a chime that got queued because the browser blocked audio until
  // the visitor interacted with the page at least once.
  useEffect(() => {
    function unlockAudio() {
      const ctx = getAudioContext()
      if (!ctx || ctx.state !== 'suspended') return
      ctx.resume().then(() => {
        if (chimePending) {
          chimePending = false
          playChimeTones(ctx)
        }
      }).catch(() => {})
    }
    document.addEventListener('pointerdown', unlockAudio)
    document.addEventListener('keydown', unlockAudio)
    return () => {
      document.removeEventListener('pointerdown', unlockAudio)
      document.removeEventListener('keydown', unlockAudio)
    }
  }, [])

  // Offers the lead-capture card once the visitor has sent a couple of
  // messages — called from sendMessage() once the exchange settles, rather
  // than a useEffect watching `messages`, since this is state derived from
  // a user action, not synchronization with an external system.
  function maybeOfferLeadCapture(currentMessages: ChatMessage[]) {
    if (leadCardState !== 'hidden') return
    if (sessionStorage.getItem(LEAD_CAPTURED_SESSION_KEY) || sessionStorage.getItem(LEAD_DISMISSED_SESSION_KEY)) return
    const userMessageCount = currentMessages.filter((message) => message.role === 'user').length
    if (userMessageCount >= LEAD_PROMPT_AFTER_MESSAGES) {
      setLeadCardState('visible')
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault()
    const name = leadName.trim()
    const email = leadEmail.trim()
    const phone = leadPhone.trim()
    if (!name || !email) {
      setLeadError('Please share your name and email.')
      return
    }

    setLeadCardState('submitting')
    setLeadError(null)

    const transcript = messages.map((message) => `${message.role === 'user' ? 'Visitor' : 'Assistant'}: ${message.text}`).join('\n')

    try {
      await createContactMessage({
        name,
        email,
        ...(phone ? { phone } : {}),
        message: transcript,
        source: 'chat',
      })
      sessionStorage.setItem(LEAD_CAPTURED_SESSION_KEY, 'true')
      setLeadCardState('submitted')
    } catch {
      setLeadError("Couldn't save your info — please try again, or use the Contact page.")
      setLeadCardState('visible')
    }
  }

  function dismissLead() {
    sessionStorage.setItem(LEAD_DISMISSED_SESSION_KEY, 'true')
    setLeadCardState('hidden')
  }

  function toggleOpen() {
    hasInteractedRef.current = true
    setIsOpen((open) => !open)
  }

  function close() {
    hasInteractedRef.current = true
    setIsOpen(false)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isSending) return

    const nextMessages = [...messages, { role: 'user', text } as ChatMessage]
    setMessages(nextMessages)
    setInput('')
    setIsSending(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })
      const data = (await response.json()) as { reply?: string; error?: string }
      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Something went wrong.')
      }
      const updatedMessages = [...nextMessages, { role: 'model', text: data.reply } as ChatMessage]
      setMessages(updatedMessages)
      maybeOfferLeadCapture(updatedMessages)
    } catch {
      setError("Couldn't reach the assistant. Please try again, or use the Contact page.")
      maybeOfferLeadCapture(nextMessages)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed right-4 bottom-20 z-50 md:right-6 md:bottom-6">
      {isOpen && (
        <div className="mb-3 flex h-[28rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 bg-blue-600 px-4 py-3">
            <p className="text-sm font-semibold text-white">{SITE_NAME} Assistant</p>
            <button
              type="button"
              onClick={close}
              aria-label="Close chat"
              className="rounded-md p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  {renderMessageText(message.text)}
                </p>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <p className="max-w-[85%] rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-500">
                  Typing…
                </p>
              </div>
            )}
            {error && <p className="text-center text-xs text-red-600">{error}</p>}

            {(leadCardState === 'visible' || leadCardState === 'submitting') && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm font-medium text-slate-900">Want us to follow up?</p>
                <p className="mt-1 text-xs text-slate-600">
                  Leave your contact info and we&rsquo;ll reach out.
                </p>
                <form onSubmit={submitLead} className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Your name"
                    disabled={leadCardState === 'submitting'}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 disabled:opacity-60"
                  />
                  <input
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="Your email"
                    disabled={leadCardState === 'submitting'}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 disabled:opacity-60"
                  />
                  <input
                    type="tel"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="Phone (optional)"
                    disabled={leadCardState === 'submitting'}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 disabled:opacity-60"
                  />
                  {leadError && <p className="text-xs text-red-600">{leadError}</p>}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={leadCardState === 'submitting'}
                      className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                    >
                      {leadCardState === 'submitting' ? 'Sending…' : 'Send my info'}
                    </button>
                    <button
                      type="button"
                      onClick={dismissLead}
                      disabled={leadCardState === 'submitting'}
                      className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-60"
                    >
                      No thanks
                    </button>
                  </div>
                </form>
              </div>
            )}

            {leadCardState === 'submitted' && (
              <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
                Thanks{leadName ? `, ${leadName}` : ''}! We&rsquo;ve got your info and will be in touch soon.
              </p>
            )}
          </div>

          <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-slate-200 p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about our services..."
              maxLength={2000}
              disabled={isSending}
              className="flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              aria-label="Send message"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={toggleOpen}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition-colors hover:bg-blue-700"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
            />
          )}
        </svg>
      </button>
    </div>
  )
}
