import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAppSelector } from '@/store/hooks'
import { rapportAnalyseApi } from '@/api/rapportAnalyseApi'
import type { RapportAnalyseResponse } from '@/types/rapportAnalyse'
import { RapportValidationModal } from './RapportValidationModal'

// ── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  file?: { name: string; size: number; type: string }
  imagePreview?: string // base64 data URL for image preview in chat
  extractedData?: RapportAnalyseResponse
  isError?: boolean
  validated?: boolean
}

interface Props {
  isOpen: boolean
  onClose: () => void
  projetId: number
  projetNom: string
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
}

// ── Utils ────────────────────────────────────────────────────────────────────
function clockTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ── Icons (inline SVG, cohérents avec la charte) ─────────────────────────────
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

function IconFile({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
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

function IconPaperclip({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49" />
    </svg>
  )
}

function IconCheck({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
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

function IconAlertCircle({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  )
}

function IconImage({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  )
}

// ── Avatars ──────────────────────────────────────────────────────────────────
function AiAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      className="flex-shrink-0 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-gray-900 overflow-hidden bg-white dark:bg-gray-800"
      style={{ width: size, height: size }}
    >
      <img src="/Logo_mika_services.png" alt="MIKA" className="w-full h-full object-contain p-0.5" />
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

// ── Welcome Card ─────────────────────────────────────────────────────────────
function WelcomeCard({ prenom, projetNom }: { prenom: string; projetNom: string }) {
  return (
    <div className="mx-1 mb-4">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 via-white to-orange-50/30 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-5 shadow-sm">
        {/* Decorative element */}
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-primary/5 dark:bg-primary/10" />
        <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-secondary/5 dark:bg-secondary/10" />

        {/* Header */}
        <div className="relative flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center p-1">
            <img src="/Logo_mika_services.png" alt="MIKA" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">MIKA Assistant</h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary/10 dark:bg-secondary-light/20 text-secondary dark:text-secondary-light">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                IA
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Assistant intelligent de suivi de chantier
            </p>
          </div>
        </div>

        {/* Greeting */}
        <div className="relative mt-4 pt-3 border-t border-gray-200/80 dark:border-gray-700/80">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Bonjour{prenom ? <span className="font-semibold"> {prenom}</span> : ''}, je suis votre assistant sur <span className="font-semibold text-secondary dark:text-secondary-light">{projetNom}</span>. Je peux analyser vos rapports et messages pour pré-remplir automatiquement les données de suivi du projet.
          </p>
        </div>

        {/* Capabilities */}
        <div className="relative mt-4 space-y-2">
          {[
            { icon: <IconSparkle size={14} className="text-primary" />, label: 'Décrivez votre journée en quelques phrases' },
            { icon: <IconFile size={14} />, label: 'Uploadez un rapport (PDF, Word, Excel)' },
            { icon: <IconImage size={14} />, label: 'Envoyez une photo du chantier' },
            { icon: <IconCheck size={14} />, label: 'Vérifiez les données avant validation' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-400">
              <span className="flex-shrink-0 w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 pr-12">
      <AiAvatar />
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-200/60 dark:border-gray-700/50">
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 bg-secondary dark:bg-secondary-light rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
          <span className="w-1.5 h-1.5 bg-secondary dark:bg-secondary-light rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
          <span className="w-1.5 h-1.5 bg-secondary dark:bg-secondary-light rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
        </div>
      </div>
    </div>
  )
}

// ── Error message mapping ────────────────────────────────────────────────────
function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { status?: number; data?: { error?: string } } }).response
    const status = resp?.status
    const code = resp?.data?.error
    if (status === 429 || code === 'QUOTA_IA_DEPASSE') return "Le service est temporairement surchargé. Réessayez dans quelques minutes."
    if (status === 503 || code === 'SERVICE_IA_INDISPONIBLE') return "Le service d'analyse est momentanément indisponible. Réessayez dans quelques instants."
    if (status === 504 || code === 'TIMEOUT_IA') return "L'analyse a pris trop de temps. Essayez avec un message plus court ou un fichier moins volumineux."
    if (status === 413) return "Le fichier est trop volumineux (max 10 Mo). Essayez un fichier plus léger."
    if (status === 403) return "Vous n'avez pas les droits pour utiliser l'assistant IA sur ce projet."
  }
  return "Une erreur inattendue s'est produite. Réessayez ou contactez le support."
}

// ── Summary builder ──────────────────────────────────────────────────────────
function buildSummaryMessage(data: RapportAnalyseResponse): string {
  if (data.champsExtraits.length === 0) {
    return "Je n'ai pas pu extraire de données exploitables de ce contenu. Essayez avec plus de détails sur votre avancement, vos points bloquants ou vos prévisions."
  }
  const parts: string[] = ["Analyse terminée. Voici ce que j'ai extrait :\n"]
  if (data.pointsBloquants?.length) parts.push(`  - ${data.pointsBloquants.length} point(s) bloquant(s)`)
  if (data.previsions?.length) parts.push(`  - ${data.previsions.length} prévision(s)`)
  if (data.suiviMensuel?.length) parts.push(`  - ${data.suiviMensuel.length} ligne(s) de CA mensuel`)
  if (data.avancementEtudes?.length) parts.push(`  - ${data.avancementEtudes.length} phase(s) d'étude`)
  if (data.avancementPhysiquePct != null) parts.push(`  - Avancement physique : ${data.avancementPhysiquePct}%`)
  if (data.avancementFinancierPct != null) parts.push(`  - Avancement financier : ${data.avancementFinancierPct}%`)
  if (data.besoinsMateriel) parts.push(`  - Besoins matériel identifiés`)
  if (data.besoinsHumain) parts.push(`  - Besoins humain identifiés`)
  if (data.avertissements.length) {
    parts.push('\nAvertissements :')
    data.avertissements.forEach(a => parts.push(`  - ${a}`))
  }
  parts.push('\nCliquez ci-dessous pour vérifier et valider les données avant enregistrement.')
  return parts.join('\n')
}

// ── Progress messages ────────────────────────────────────────────────────────
const PROGRESS_MESSAGES = [
  "Réception du message…",
  "Lecture et compréhension du contenu…",
  "Extraction des données de suivi…",
  "Structuration des résultats…",
]

// ── Main Component ───────────────────────────────────────────────────────────
export function ProjetChatbotDrawer({ isOpen, onClose, projetId, projetNom, messages, setMessages }: Props) {
  const currentUser = useAppSelector((state) => state.auth.user)
  const [inputText, setInputText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progressIdx, setProgressIdx] = useState(0)
  const [validationData, setValidationData] = useState<RapportAnalyseResponse | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prenom = currentUser?.prenom ?? ''

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, progressIdx])

  // Focus on open
  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 350)
  }, [isOpen])

  // Progress timer
  useEffect(() => {
    if (!isLoading) { setProgressIdx(0); return }
    const interval = setInterval(() => {
      setProgressIdx(prev => Math.min(prev + 1, PROGRESS_MESSAGES.length - 1))
    }, 3000)
    return () => clearInterval(interval)
  }, [isLoading])

  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    const file = selectedFile
    if (!text && !file) return

    // Generate image preview if file is an image
    let imagePreview: string | undefined
    if (file && file.type.startsWith('image/')) {
      imagePreview = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
    }

    setMessages(prev => [...prev, {
      id: uid(),
      role: 'user',
      content: text || '',
      timestamp: new Date(),
      file: file ? { name: file.name, size: file.size, type: file.type } : undefined,
      imagePreview,
    }])
    setInputText('')
    setSelectedFile(null)
    setIsLoading(true)

    try {
      const response = await rapportAnalyseApi.analyser(projetId, {
        file: file ?? undefined,
        texte: text || undefined,
      })
      setMessages(prev => [...prev, {
        id: uid(),
        role: 'assistant',
        content: buildSummaryMessage(response),
        timestamp: new Date(),
        extractedData: response.champsExtraits.length > 0 ? response : undefined,
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        id: uid(),
        role: 'assistant',
        content: getErrorMessage(error),
        timestamp: new Date(),
        isError: true,
      }])
    } finally {
      setIsLoading(false)
    }
  }, [inputText, selectedFile, projetId, setMessages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
    e.target.value = ''
  }

  const handleValidationClick = (extractedData: RapportAnalyseResponse) => {
    setValidationData(extractedData)
  }

  const handleValidationSuccess = () => {
    setValidationData(null)
    // Marquer le message source comme validé pour désactiver le CTA
    setMessages(prev => prev.map(msg =>
      msg.extractedData && !msg.validated ? { ...msg, validated: true } : msg
    ))
    setMessages(prev => [...prev, {
      id: uid(),
      role: 'assistant',
      content: "Données enregistrées avec succès. Les informations de suivi du projet ont été mises à jour.",
      timestamp: new Date(),
    }])
  }

  const handleValidationClose = () => {
    setValidationData(null)
    setMessages(prev => [...prev, {
      id: uid(),
      role: 'assistant',
      content: "Validation annulée. Les données extraites n'ont pas été enregistrées.",
      timestamp: new Date(),
    }])
  }

  if (!isOpen) return null

  const drawer = (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Assistant IA">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full lg:w-[500px] lg:max-w-[500px] h-full flex flex-col bg-white dark:bg-gray-900 shadow-2xl animate-slide-in-right max-lg:animate-slide-in-up border-l border-gray-200 dark:border-gray-800">

        {/* ── Header ── */}
        <div className="shrink-0 px-4 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Fermer">
              <IconClose />
            </button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center p-0.5 shadow-sm">
                  <img src="/Logo_mika_services.png" alt="MIKA" className="w-full h-full object-contain" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-white dark:border-gray-900" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">MIKA Assistant</h2>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-secondary dark:text-secondary-light bg-secondary/8 dark:bg-secondary-light/15">IA</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{projetNom}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {/* Welcome card */}
          <WelcomeCard prenom={prenom} projetNom={projetNom} />

          {/* Messages */}
          {messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex items-end gap-2.5 flex-row-reverse">
                  <UserAvatar prenom={currentUser?.prenom} nom={currentUser?.nom} />
                  <div className="max-w-[78%] flex flex-col items-end">
                    {msg.imagePreview && (
                      <div className="mb-1.5 rounded-xl rounded-br-sm overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 max-w-[240px]">
                        <img src={msg.imagePreview} alt="Photo chantier" className="w-full h-auto object-cover max-h-[200px]" />
                        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
                          <IconFile size={11} />
                          <span className="truncate">{msg.file?.name}</span>
                        </div>
                      </div>
                    )}
                    {msg.file && !msg.imagePreview && (
                      <div className="mb-1.5 flex items-center gap-2 px-3 py-2 rounded-xl rounded-br-sm text-xs bg-secondary text-white shadow-sm">
                        <IconFile size={13} />
                        <span className="truncate max-w-[140px] font-medium">{msg.file.name}</span>
                        <span className="opacity-60 text-[10px]">{formatFileSize(msg.file.size)}</span>
                      </div>
                    )}
                    {msg.content && (
                      <div className="px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed whitespace-pre-wrap bg-secondary dark:bg-secondary text-white shadow-sm">
                        {msg.content}
                      </div>
                    )}
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
                    {msg.isError && (
                      <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                        <IconAlertCircle />
                        Erreur
                      </div>
                    )}
                    {msg.content}
                  </div>
                  {msg.extractedData && !msg.validated && (
                    <button
                      onClick={() => handleValidationClick(msg.extractedData!)}
                      className="mt-2.5 group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <IconCheck />
                      Voir et valider les données
                      <IconArrowRight />
                    </button>
                  )}
                  {msg.extractedData && msg.validated && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 text-success text-xs font-medium">
                      <IconCheck size={13} />
                      Données validées et enregistrées
                    </div>
                  )}
                  <span className="mt-1 text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">{clockTime(msg.timestamp)}</span>
                </div>
              </div>
            )
          })}

          {/* Typing */}
          {isLoading && (
            <div className="space-y-3">
              <div className="flex items-end gap-2.5">
                <AiAvatar />
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-secondary dark:text-secondary-light italic shadow-sm">
                  {PROGRESS_MESSAGES[progressIdx]}
                </div>
              </div>
              <TypingIndicator />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input ── */}
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
          {selectedFile && (
            <div className="mb-2.5 flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-700 dark:text-gray-300">
              {selectedFile.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Aperçu"
                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                />
              ) : (
                <IconFile size={13} />
              )}
              <span className="truncate flex-1 font-medium">{selectedFile.name}</span>
              <span className="text-[10px] text-gray-400">{formatFileSize(selectedFile.size)}</span>
              <button onClick={() => setSelectedFile(null)} className="ml-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <IconClose size={12} />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-gray-400 hover:text-secondary dark:hover:text-secondary-light hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Joindre un fichier ou une photo"
              disabled={isLoading}
            >
              <IconPaperclip />
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.xlsx,.xls,.jpg,.jpeg,.png" onChange={handleFileSelect} className="hidden" />
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={handleKeyDown}
              placeholder="Décrivez votre journée sur le chantier..."
              disabled={isLoading}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:focus:border-primary disabled:opacity-50 transition-all"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || (!inputText.trim() && !selectedFile)}
              className="p-2.5 rounded-xl text-white transition-all duration-200 shadow-sm disabled:opacity-40 disabled:shadow-none bg-primary hover:bg-primary-dark disabled:bg-gray-300 dark:disabled:bg-gray-700"
              title="Envoyer"
            >
              <IconSend />
            </button>
          </div>
          <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500 text-center">
            MIKA Assistant peut faire des erreurs. Vérifiez les données extraites avant validation.
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {createPortal(drawer, document.body)}
      {validationData && (
        <RapportValidationModal
          isOpen={true}
          onClose={handleValidationClose}
          onSuccess={handleValidationSuccess}
          projetId={projetId}
          data={validationData}
        />
      )}
    </>
  )
}

// ── Floating Button ──────────────────────────────────────────────────────────
export function ChatbotFloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center bg-secondary hover:bg-secondary-dark group"
      title="Assistant IA"
      aria-label="Ouvrir l'assistant IA"
    >
      <IconSparkle size={24} className="text-white group-hover:scale-110 transition-transform duration-200" />
    </button>
  )
}
