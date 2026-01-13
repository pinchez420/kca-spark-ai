import { SupabaseClient } from '@supabase/supabase-js';

// Message role types
export type MessageRole = 'system' | 'user' | 'assistant';

// Base message interface
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  created_at: string;
  conversation_id?: string;
  metadata?: MessageMetadata;
}

// Message metadata for additional information
export interface MessageMetadata {
  tokens?: number;
  model?: string;
  response_time?: number;
}

// Conversation interface
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  messages?: Message[];
}

// Conversation with preview
export interface ConversationWithPreview extends Omit<Conversation, 'messages'> {
  last_message?: string;
  message_count: number;
}

// Chat settings
export interface ChatSettings {
  temperature: number; // 0-2, default 0.7
  max_tokens: number; // max tokens in response
  system_prompt: string;
  model?: string;
}

// Chat state from context
export interface ChatState {
  messages: Message[];
  conversations: ConversationWithPreview[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  isStreaming: boolean;
  settings: ChatSettings;
}

// Chat actions
export interface ChatActions {
  sendMessage: (content: string) => Promise<void>;
  createConversation: (title?: string) => Promise<Conversation>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  archiveConversation: (id: string) => Promise<void>;
  clearMessages: () => void;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  loadConversations: () => Promise<void>;
}

// Combined chat context type
export interface ChatContextType extends ChatState, ChatActions {}

// Supabase chat service interface
export interface ChatService {
  client: SupabaseClient;
  
  // Messages
  saveMessage: (message: Omit<Message, 'id' | 'created_at'>) => Promise<Message>;
  getMessages: (conversationId: string) => Promise<Message[]>;
  
  // Conversations
  createConversation: (userId: string, title: string) => Promise<Conversation>;
  getConversations: (userId: string) => Promise<ConversationWithPreview[]>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
}

// Export formats
export type ExportFormat = 'txt' | 'json' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  includeTimestamps: boolean;
  includeMetadata: boolean;
}

// Quick action suggestion
export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
  category: string;
}

// Voice state
export interface VoiceState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
}

