import React from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Sparkles, Calendar, DollarSign, BookOpen, GraduationCap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
  onSelect?: (prompt: string) => void;
  className?: string;
}

// Pre-defined quick actions based on common KCA University queries
const defaultQuickActions = [
  {
    id: 'timetable',
    label: 'My Timetable',
    prompt: 'Show me my class timetable for today and this week',
    icon: Calendar,
    category: 'academic'
  },
  {
    id: 'fees',
    label: 'Fee Status',
    prompt: 'What is my current fee balance and payment deadline?',
    icon: DollarSign,
    category: 'financial'
  },
  {
    id: 'exams',
    label: 'Exam Schedule',
    prompt: 'When are my upcoming exams and what are the venues?',
    icon: Clock,
    category: 'academic'
  },
  {
    id: 'courses',
    label: 'My Courses',
    prompt: 'What courses am I enrolled in this semester?',
    icon: BookOpen,
    category: 'academic'
  },
  {
    id: 'grades',
    label: 'My Grades',
    prompt: 'Show me my recent grades and GPA',
    icon: GraduationCap,
    category: 'academic'
  },
  {
    id: 'help',
    label: 'General Help',
    prompt: 'What can you help me with at KCA University?',
    icon: Sparkles,
    category: 'general'
  }
];

export function QuickActions({ onSelect, className }: QuickActionsProps) {
  const { sendMessage, isLoading } = useChat();

  const handleSelect = async (prompt: string) => {
    if (onSelect) {
      onSelect(prompt);
    } else {
      await sendMessage(prompt);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="group" aria-label="Quick actions">
      {defaultQuickActions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            onClick={() => handleSelect(action.prompt)}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4 text-primary" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

// Context-aware quick actions based on conversation
export function ContextualQuickActions({ 
  lastMessage, 
  onSelect 
}: { 
  lastMessage?: string;
  onSelect?: (prompt: string) => void;
}) {
  const { sendMessage, isLoading } = useChat();

  // Generate contextual suggestions based on the last message
  const getContextualSuggestions = () => {
    if (!lastMessage) return [];

    const messageLower = lastMessage.toLowerCase();
    const suggestions = [];

    if (messageLower.includes('timetable') || messageLower.includes('class') || messageLower.includes('schedule')) {
      suggestions.push(
        { label: 'Tomorrow\'s Classes', prompt: 'What classes do I have tomorrow?' },
        { label: 'Full Week', prompt: 'Show me my complete weekly timetable' },
        { label: 'Room Details', prompt: 'What are the room numbers for my classes?' }
      );
    }

    if (messageLower.includes('fee') || messageLower.includes('payment') || messageLower.includes('balance')) {
      suggestions.push(
        { label: 'Payment Options', prompt: 'What payment methods are available?' },
        { label: 'Installments', prompt: 'Can I pay my fees in installments?' },
        { label: 'Receipts', prompt: 'How do I get my payment receipts?' }
      );
    }

    if (messageLower.includes('exam') || messageLower.includes('test') || messageLower.includes('assessment')) {
      suggestions.push(
        { label: 'Study Tips', prompt: 'Give me study tips for this exam' },
        { label: 'Past Papers', prompt: 'Where can I find past exam papers?' },
        { label: 'Exam Rules', prompt: 'What are the exam rules and regulations?' }
      );
    }

    if (messageLower.includes('grade') || messageLower.includes('result') || messageLower.includes('mark')) {
      suggestions.push(
        { label: 'GPA Info', prompt: 'How is my GPA calculated?' },
        { label: 'Grade Appeal', prompt: 'How do I appeal a grade?' },
        { label: 'Transcript', prompt: 'How do I get my official transcript?' }
      );
    }

    // General suggestions if no specific context
    if (suggestions.length === 0) {
      suggestions.push(
        { label: 'Tell me more', prompt: 'Can you tell me more about this?' },
        { label: 'Examples', prompt: 'Can you give me some examples?' },
        { label: 'Summary', prompt: 'Can you summarize the key points?' }
      );
    }

    return suggestions.slice(0, 3);
  };

  const suggestions = getContextualSuggestions();

  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <span className="text-xs text-muted-foreground w-full">Suggested:</span>
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="secondary"
          size="sm"
          onClick={() => onSelect ? onSelect(suggestion.prompt) : sendMessage(suggestion.prompt)}
          disabled={isLoading}
          className="text-xs"
        >
          {suggestion.label}
        </Button>
      ))}
    </div>
  );
}

export default QuickActions;

