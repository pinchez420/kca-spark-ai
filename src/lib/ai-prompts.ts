import type { ChatSettings } from '@/types/chat';

// Default system prompt
export const DEFAULT_SYSTEM_PROMPT = `You are KCA Connect AI, an intelligent assistant for KCA University students. 

## Your Role
You help students with any questions about KCA University including academics, campus life, and administrative matters.

## Knowledge Areas
- Timetables and class schedules
- Fee structures and payment options
- Exam schedules and results
- Campus facilities and services
- Academic programs and requirements
- Student support services
- General university information

## Guidelines
1. Be helpful, friendly, and professional
2. If you don't know specific information, say so honestly
3. Provide accurate information based on your training
4. Format your responses clearly with appropriate structure
5. Use bullet points and numbered lists for clarity
6. Be concise but thorough

## Response Style
- Use markdown formatting for better readability
- Include relevant headers and sections
- Highlight important information
- Keep responses focused and relevant`;

export const PROMPT_TEMPLATES = {
  academic: `You are an academic advisor for KCA University. Help the student with:
- Course selection and registration
- Academic requirements and prerequisites
- Grade interpretation and GPA calculation
- Study tips and time management
- Academic support resources`,

  financial: `You are a financial services assistant for KCA University. Help the student with:
- Fee structures and payment plans
- Financial aid and scholarships
- Payment deadlines and methods
- Fee refund policies
- Account balance inquiries`,

  administrative: `You are an administrative assistant for KCA University. Help the student with:
- Document requests and submissions
- University policies and procedures
- Campus services and facilities
- Contact information for departments
- General administrative inquiries`,

  general: DEFAULT_SYSTEM_PROMPT
};

export function getSystemPrompt(category: keyof typeof PROMPT_TEMPLATES = 'general'): string {
  return PROMPT_TEMPLATES[category] || PROMPT_TEMPLATES.general;
}

export function createCustomPrompt(settings: Partial<ChatSettings>): string {
  const parts: string[] = [DEFAULT_SYSTEM_PROMPT];
  
  if (settings.temperature !== undefined) {
    parts.push(`\n## Response Style\nUse a ${settings.temperature < 0.5 ? 'precise and focused' : settings.temperature > 1.5 ? 'creative and varied' : 'balanced'} response style.`);
  }
  
  if (settings.max_tokens !== undefined) {
    parts.push(`\n## Length\nKeep responses concise but thorough, up to approximately ${settings.max_tokens} tokens.`);
  }
  
  if (settings.system_prompt) {
    parts.push(`\n## Custom Instructions\n${settings.system_prompt}`);
  }
  
  return parts.join('\n');
}

export function generateTitleFromFirstMessage(messages: { role: string; content: string }[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user')?.content || '';
  
  if (!firstUserMessage) return 'New Chat';
  
  // Extract key topics from the first message
  const words = firstUserMessage.split(/\s+/).filter(w => w.length > 4);
  const keyTopics = words.slice(0, 4).map(w => w.replace(/[^a-zA-Z]/g, ''));
  
  if (keyTopics.length === 0) return 'New Chat';
  
  return keyTopics.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
}

export const QUICK_ACTIONS = [
  { id: 'timetable', label: 'My Timetable', prompt: 'Show me my class timetable for today and this week', category: 'academic' },
  { id: 'fees', label: 'Fee Status', prompt: 'What is my current fee balance and payment deadline?', category: 'financial' },
  { id: 'exams', label: 'Exam Schedule', prompt: 'When are my upcoming exams and what are the venues?', category: 'academic' },
  { id: 'courses', label: 'My Courses', prompt: 'What courses am I enrolled in this semester?', category: 'academic' },
  { id: 'grades', label: 'My Grades', prompt: 'Show me my recent grades and GPA', category: 'academic' },
  { id: 'help', label: 'General Help', prompt: 'What can you help me with at KCA University?', category: 'general' }
];

export const SUGGESTED_FOLLOWUPS = {
  timetable: ['What classes do I have tomorrow?', 'Show me my complete weekly timetable', 'What are the room numbers for my classes?'],
  fees: ['What payment methods are available?', 'Can I pay my fees in installments?', 'How do I get my payment receipts?'],
  exams: ['Give me study tips for this exam', 'Where can I find past exam papers?', 'What are the exam rules and regulations?'],
  grades: ['How is my GPA calculated?', 'How do I appeal a grade?', 'How do I get my official transcript?'],
  default: ['Can you tell me more about this?', 'Can you give me some examples?', 'Can you summarize the key points?']
};

export function getSuggestedFollowups(context: string): string[] {
  const contextLower = context.toLowerCase();
  
  if (contextLower.includes('timetable') || contextLower.includes('class')) return SUGGESTED_FOLLOWUPS.timetable;
  if (contextLower.includes('fee') || contextLower.includes('payment')) return SUGGESTED_FOLLOWUPS.fees;
  if (contextLower.includes('exam')) return SUGGESTED_FOLLOWUPS.exams;
  if (contextLower.includes('grade') || contextLower.includes('result')) return SUGGESTED_FOLLOWUPS.grades;
  
  return SUGGESTED_FOLLOWUPS.default;
}
