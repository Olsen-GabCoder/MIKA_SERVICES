export interface MikaAssistantRequest {
  message: string
  pageContext: string
  pageRoute: string
  conversationHistory: ConversationMessage[]
  pageData: Record<string, unknown>
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface SuggestedAction {
  label: string
  route?: string
  type: 'navigate' | 'info'
}

export interface MikaAssistantResponse {
  reply: string
  actions: SuggestedAction[]
  tokensUsed: number
}

export interface MikaChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isError?: boolean
  actions?: SuggestedAction[]
}
