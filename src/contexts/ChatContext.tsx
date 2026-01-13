import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { 
  Message, 
  Conversation, 
  ConversationWithPreview, 
  ChatSettings,
  ChatContextType 
} from '@/types/chat';

// Get Supabase URL and key from environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Create Supabase client (handle missing env vars gracefully)
const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables not set');
    return null;
  }
  return createClient(supabaseUrl, supabaseKey);
};

const supabase = getSupabaseClient();

// Default settings
const defaultSettings: ChatSettings = {
  temperature: 0.7,
  max_tokens: 1024,
  system_prompt: `You are KCA Connect AI, an intelligent assistant for KCA University students. 
You help with questions about:
- Timetables and class schedules
- Fee structures and payments
- Exam schedules and results
- Campus facilities and services
- Academic programs and requirements
- General university information

Be helpful, friendly, and concise. If you don't know something, say so honestly.`
};

// Initial state
interface ChatState {
  messages: Message[];
  conversations: ConversationWithPreview[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  isStreaming: boolean;
  settings: ChatSettings;
  userId: string | null;
}

// Action types
type ChatAction =
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_LAST_MESSAGE'; payload: Partial<Message> }
  | { type: 'SET_CONVERSATIONS'; payload: ConversationWithPreview[] }
  | { type: 'ADD_CONVERSATION'; payload: ConversationWithPreview }
  | { type: 'UPDATE_CONVERSATION'; payload: { id: string; updates: Partial<ConversationWithPreview> } }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Conversation | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STREAMING'; payload: boolean }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<ChatSettings> }
  | { type: 'SET_USER_ID'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'RESET' };

// Reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    
    case 'UPDATE_LAST_MESSAGE':
      if (state.messages.length === 0) return state;
      const updatedMessages = [...state.messages];
      updatedMessages[updatedMessages.length - 1] = {
        ...updatedMessages[updatedMessages.length - 1],
        ...action.payload
      };
      return { ...state, messages: updatedMessages };
    
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    
    case 'ADD_CONVERSATION':
      return { ...state, conversations: [action.payload, ...state.conversations] };
    
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id
            ? { ...conv, ...action.payload.updates }
            : conv
        )
      };
    
    case 'DELETE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.filter(conv => conv.id !== action.payload),
        currentConversation: state.currentConversation?.id === action.payload
          ? null
          : state.currentConversation
      };
    
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_STREAMING':
      return { ...state, isStreaming: action.payload };
    
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    
    case 'SET_USER_ID':
      return { ...state, userId: action.payload };
    
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    
    case 'RESET':
      return {
        messages: [],
        conversations: [],
        currentConversation: null,
        isLoading: false,
        isStreaming: false,
        settings: defaultSettings,
        userId: null
      };
    
    default:
      return state;
  }
}

// Context
const ChatContext = createContext<ChatContextType | null>(null);

// Provider props
interface ChatProviderProps {
  children: React.ReactNode;
  initialUserId?: string;
}

// Provider component
export function ChatProvider({ children, initialUserId }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, {
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm KCA Connect AI. How can I help you today? You can ask me about timetables, fees, exams, or any other university information.",
        created_at: new Date().toISOString()
      }
    ],
    conversations: [],
    currentConversation: null,
    isLoading: false,
    isStreaming: false,
    settings: defaultSettings,
    userId: initialUserId || null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Set user ID when available
  useEffect(() => {
    if (initialUserId) {
      dispatch({ type: 'SET_USER_ID', payload: initialUserId });
      loadConversations(initialUserId);
    }
  }, [initialUserId]);

  // Save messages to localStorage for persistence
  useEffect(() => {
    if (state.currentConversation && state.messages.length > 0) {
      localStorage.setItem(`chat_${state.currentConversation.id}`, JSON.stringify(state.messages));
    }
  }, [state.messages, state.currentConversation]);

  // Load conversation messages from storage
  const loadConversationMessages = useCallback(async (conversationId: string) => {
    // Try localStorage first
    const cached = localStorage.getItem(`chat_${conversationId}`);
    if (cached) {
      try {
        const messages = JSON.parse(cached);
        dispatch({ type: 'SET_MESSAGES', payload: messages });
        return;
      } catch (e) {
        console.error('Failed to parse cached messages:', e);
      }
    }

    // Try Supabase if available
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          const messages: Message[] = data.map(msg => ({
            id: msg.id,
            role: msg.role as Message['role'],
            content: msg.content,
            created_at: msg.created_at,
            conversation_id: msg.conversation_id,
            metadata: msg.metadata
          }));
          dispatch({ type: 'SET_MESSAGES', payload: messages });
          // Cache for offline access
          localStorage.setItem(`chat_${conversationId}`, JSON.stringify(messages));
        }
      } catch (e) {
        console.error('Failed to load messages from Supabase:', e);
      }
    }
  }, []);

  // Load conversations
  const loadConversations = useCallback(async (userId: string) => {
    if (!supabase) {
      // Load from localStorage
      const cached = localStorage.getItem(`conversations_${userId}`);
      if (cached) {
        try {
          const conversations = JSON.parse(cached);
          dispatch({ type: 'SET_CONVERSATIONS', payload: conversations });
        } catch (e) {
          console.error('Failed to parse cached conversations:', e);
        }
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select(`
          id, user_id, title, created_at, updated_at, is_archived,
          chat_messages (id, content, role, created_at)
        `)
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      const conversations: ConversationWithPreview[] = data.map(conv => {
        const messages = conv.chat_messages || [];
        const sortedMessages = messages.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        return {
          id: conv.id,
          user_id: conv.user_id,
          title: conv.title,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          is_archived: conv.is_archived,
          last_message: sortedMessages.length > 0 
            ? sortedMessages[sortedMessages.length - 1].content 
            : '',
          message_count: sortedMessages.length
        };
      });

      dispatch({ type: 'SET_CONVERSATIONS', payload: conversations });
      localStorage.setItem(`conversations_${userId}`, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  }, []);

  // Create new conversation
  const createConversation = useCallback(async (title?: string): Promise<Conversation> => {
    if (!state.userId) {
      throw new Error('User not authenticated');
    }

    const conversationTitle = title || 'New Conversation';

    if (!supabase) {
      // Create locally
      const tempId = crypto.randomUUID();
      const conversation: Conversation = {
        id: tempId,
        user_id: state.userId,
        title: conversationTitle,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_archived: false
      };

      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
      dispatch({ type: 'CLEAR_MESSAGES' });
      dispatch({
        type: 'ADD_CONVERSATION',
        payload: { ...conversation, last_message: '', message_count: 0 }
      });

      return conversation;
    }

    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({ user_id: state.userId, title: conversationTitle })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }

    const conversation: Conversation = {
      id: data.id,
      user_id: data.user_id,
      title: data.title,
      created_at: data.created_at,
      updated_at: data.updated_at,
      is_archived: data.is_archived
    };

    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
    dispatch({ type: 'CLEAR_MESSAGES' });
    dispatch({
      type: 'ADD_CONVERSATION',
      payload: { ...conversation, last_message: '', message_count: 0 }
    });

    return conversation;
  }, [state.userId]);

  // Select conversation
  const selectConversation = useCallback(async (id: string) => {
    const conversation = state.conversations.find(c => c.id === id);
    if (conversation) {
      dispatch({
        type: 'SET_CURRENT_CONVERSATION',
        payload: {
          id: conversation.id,
          user_id: conversation.user_id,
          title: conversation.title,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          is_archived: conversation.is_archived
        }
      });
      await loadConversationMessages(id);
    }
  }, [state.conversations, loadConversationMessages]);

  // Delete conversation
  const deleteConversation = useCallback(async (id: string) => {
    if (supabase) {
      await supabase.from('chat_conversations').update({ is_archived: true }).eq('id', id);
    }
    localStorage.removeItem(`chat_${id}`);
    dispatch({ type: 'DELETE_CONVERSATION', payload: id });
  }, []);

  // Rename conversation
  const renameConversation = useCallback(async (id: string, title: string) => {
    if (supabase) {
      await supabase.from('chat_conversations').update({ title, updated_at: new Date().toISOString() }).eq('id', id);
    }
    dispatch({ type: 'UPDATE_CONVERSATION', payload: { id, updates: { title } } });
  }, []);

  // Archive conversation
  const archiveConversation = useCallback(async (id: string) => {
    if (supabase) {
      await supabase.from('chat_conversations').update({ is_archived: true }).eq('id', id);
    }
    dispatch({ type: 'DELETE_CONVERSATION', payload: id });
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);

  // Update settings
  const updateSettings = useCallback((settings: Partial<ChatSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    if (state.userId) {
      localStorage.setItem(`chat_settings_${state.userId}`, JSON.stringify({ ...state.settings, ...settings }));
    }
  }, [state.settings, state.userId]);

  // Send message to AI
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString()
    };

    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_STREAMING', payload: true });

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "I'm KCA Connect AI. To provide accurate responses, please configure the Supabase Edge Function.\n\nRequired: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env",
          created_at: new Date().toISOString()
        };
        
        dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_STREAMING', payload: false });
        return;
      }

      const messagesForAPI = [
        { role: 'system', content: state.settings.system_prompt },
        ...state.messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }))
      ];

      const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: messagesForAPI,
          sessionId: state.currentConversation?.id,
          temperature: state.settings.temperature,
          max_tokens: state.settings.max_tokens
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response from AI');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      const assistantMessageId = crypto.randomUUID();
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { id: assistantMessageId, role: 'assistant', content: '', created_at: new Date().toISOString() }
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              assistantContent += content;
              dispatch({ type: 'UPDATE_LAST_MESSAGE', payload: { content: assistantContent } });
            }
          } catch (e) {
            console.warn('Failed to parse SSE message:', line);
          }
        }
      }

      // Save to Supabase if available
      if (supabase && state.currentConversation) {
        await supabase.from('chat_messages').insert({
          conversation_id: state.currentConversation.id,
          role: 'user',
          content: userMessage.content
        });
        await supabase.from('chat_messages').insert({
          conversation_id: state.currentConversation.id,
          role: 'assistant',
          content: assistantContent
        });
        await supabase.from('chat_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', state.currentConversation.id);
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Chat error:', error);
        dispatch({
          type: 'UPDATE_LAST_MESSAGE',
          payload: { content: (state.messages[state.messages.length - 1]?.content || '') + "\n\nI'm sorry, I encountered an error. Please try again." }
        });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_STREAMING', payload: false });
    }
  }, [state.isLoading, state.messages, state.settings, state.currentConversation]);

  const value: ChatContextType = {
    messages: state.messages,
    conversations: state.conversations,
    currentConversation: state.currentConversation,
    isLoading: state.isLoading,
    isStreaming: state.isStreaming,
    settings: state.settings,
    sendMessage,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    archiveConversation,
    clearMessages,
    updateSettings,
    loadConversations
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

// Hook
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;

