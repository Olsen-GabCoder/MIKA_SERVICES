import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { useGuidance } from '@/contexts/GuidanceContext'
import { mikaAssistantApi } from '@/api/mikaAssistantApi'
import type { MikaChatMessage, ConversationMessage, SuggestedAction } from '@/types/mikaAssistant'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function clockTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/* ── Icons ── */
function IconSparkle({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
    </svg>
  )
}

function IconClose({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function IconSend({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  )
}

function IconArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

/* ── Avatar ── */
function AiAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      className="flex-shrink-0 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-gray-900 overflow-hidden bg-white dark:bg-gray-800"
      style={{ width: size, height: size }}
    >
      <img src="/Logo_mika_services.png" alt="Mika" className="w-full h-full object-contain p-0.5" />
    </div>
  )
}

function UserAvatar({ prenom, nom }: { prenom?: string; nom?: string }) {
  const initials = `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase()
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-secondary dark:bg-secondary-light text-white text-xs font-bold ring-2 ring-white dark:ring-gray-900">
      {initials}
    </div>
  )
}

/* ── Typing indicator ── */
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 pr-12">
      <AiAvatar />
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-200/60 dark:border-gray-700/50">
        <div className="flex gap-1.5">
          {[0, 150, 300].map(d => (
            <span key={d} className="w-1.5 h-1.5 bg-secondary dark:bg-secondary-light rounded-full animate-bounce" style={{ animationDelay: `${d}ms`, animationDuration: '0.6s' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Suggestion chips ── */
function SuggestionChips({ suggestions, onSelect, disabled }: { suggestions: string[]; onSelect: (s: string) => void; disabled: boolean }) {
  return (
    <div className="flex flex-wrap gap-2 px-1">
      {suggestions.map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-secondary hover:text-secondary dark:hover:border-secondary-light dark:hover:text-secondary-light transition-colors disabled:opacity-40"
        >
          {s}
        </button>
      ))}
    </div>
  )
}

/* ── Action buttons from IA ── */
function ActionButtons({ actions }: { actions: SuggestedAction[] }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {actions.map((a, i) => (
        <button
          key={i}
          type="button"
          onClick={() => a.route && navigate(a.route)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-light dark:hover:bg-primary/30 transition-colors"
        >
          {a.label}
          {a.route && <IconArrowRight size={11} />}
        </button>
      ))}
    </div>
  )
}

/* ── Welcome card ── */
function WelcomeCard({ prenom, greeting }: { prenom: string; greeting: string }) {
  return (
    <div className="mx-1 mb-4">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 via-white to-orange-50/30 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-5 shadow-sm">
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-primary/5 dark:bg-primary/10" />
        <div className="relative flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center p-1">
            <img src="/Logo_mika_services.png" alt="Mika" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Mika</h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary/10 dark:bg-secondary-light/20 text-secondary dark:text-secondary-light">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                IA
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Assistant intelligent MIKA Services</p>
          </div>
        </div>
        <div className="relative mt-4 pt-3 border-t border-gray-200/80 dark:border-gray-700/80">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Bonjour{prenom ? <span className="font-semibold"> {prenom}</span> : ''} ! {greeting}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Main Drawer ── */
export function MikaAssistantDrawer() {
  const { assistantOpen, closeAssistant, pageGuidance } = useGuidance()
  const location = useLocation()
  const currentUser = useAppSelector((state) => state.auth.user)
  const prenom = currentUser?.prenom ?? ''

  const [messages, setMessages] = useState<MikaChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (assistantOpen) setTimeout(() => textareaRef.current?.focus(), 350)
  }, [assistantOpen])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: MikaChatMessage = {
      id: uid(), role: 'user', content: text.trim(), timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsLoading(true)

    const history: ConversationMessage[] = messages.slice(-10).map(m => ({
      role: m.role, content: m.content
    }))

    try {
      const response = await mikaAssistantApi.ask({
        message: text.trim(),
        pageContext: pageGuidance.context,
        pageRoute: location.pathname,
        conversationHistory: history,
        pageData: {},
      })
      setMessages(prev => [...prev, {
        id: uid(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
        actions: response.actions.length > 0 ? response.actions : undefined,
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: uid(),
        role: 'assistant',
        content: 'Desole, je rencontre un probleme technique. Reessayez dans quelques instants.',
        timestamp: new Date(),
        isError: true,
      }])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, messages, pageGuidance.context, location.pathname])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputText) }
  }

  if (!assistantOpen) return null

  const drawer = (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Assistant Mika">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={closeAssistant} />

      {/* Panel */}
      <div className="relative w-full lg:w-[460px] lg:max-w-[460px] h-full flex flex-col bg-white dark:bg-gray-900 shadow-2xl animate-slide-in-right max-lg:animate-slide-in-up border-l border-gray-200 dark:border-gray-800">

        {/* Header */}
        <div className="shrink-0 px-4 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <button onClick={closeAssistant} className="p-1.5 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Fermer">
              <IconClose />
            </button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center p-0.5 shadow-sm">
                  <img src="/Logo_mika_services.png" alt="Mika" className="w-full h-full object-contain" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-white dark:border-gray-900" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Mika</h2>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-secondary dark:text-secondary-light bg-secondary/8 dark:bg-secondary-light/15">IA</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Assistant intelligent</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          <WelcomeCard prenom={prenom} greeting={pageGuidance.greeting} />

          {messages.length === 0 && (
            <SuggestionChips suggestions={pageGuidance.suggestions} onSelect={sendMessage} disabled={isLoading} />
          )}

          {messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex items-end gap-2.5 flex-row-reverse">
                  <UserAvatar prenom={currentUser?.prenom} nom={currentUser?.nom} />
                  <div className="max-w-[78%] flex flex-col items-end">
                    <div className="px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed whitespace-pre-wrap bg-secondary text-white shadow-sm">
                      {msg.content}
                    </div>
                    <span className="mt-1 text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">{clockTime(msg.timestamp)}</span>
                  </div>
                </div>
              )
            }
            return (
              <div key={msg.id} className="flex items-end gap-2.5">
                <AiAvatar />
                <div className="max-w-[82%] flex flex-col items-start">
                  <div className={`px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.isError
                      ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.actions && <ActionButtons actions={msg.actions} />}
                  <span className="mt-1 text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">{clockTime(msg.timestamp)}</span>
                </div>
              </div>
            )
          })}

          {isLoading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              disabled={isLoading}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:focus:border-primary disabled:opacity-50 transition-all"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
            <button
              onClick={() => sendMessage(inputText)}
              disabled={isLoading || !inputText.trim()}
              className="p-2.5 rounded-xl text-white transition-all duration-200 shadow-sm disabled:opacity-40 disabled:shadow-none bg-primary hover:bg-primary-dark disabled:bg-gray-300 dark:disabled:bg-gray-700"
              title="Envoyer"
            >
              <IconSend />
            </button>
          </div>
          <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500 text-center">
            Mika peut faire des erreurs. Verifiez les informations importantes.
          </p>
        </div>
      </div>
    </div>
  )

  return createPortal(drawer, document.body)
}
