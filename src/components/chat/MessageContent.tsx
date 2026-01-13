import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MessageContentProps {
  content: string;
  role: 'user' | 'assistant';
  className?: string;
}

export function MessageContent({ content, role, className }: MessageContentProps) {
  const isUser = role === 'user';

  return (
    <div 
      className={cn(
        "prose prose-sm max-w-none",
        isUser ? "prose-invert" : "prose-neutral",
        className
      )}
    >
      <ReactMarkdown
        components={{
          // Style links
          a: ({ node, ...props }) => (
            <a 
              {...props} 
              className="text-primary underline underline-offset-2 hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          // Style code blocks
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code 
                  {...props} 
                  className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono"
                >
                  {children}
                </code>
              );
            }
            return (
              <code 
                {...props} 
                className={cn("block bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto", className)}
              >
                {children}
              </code>
            );
          },
          // Style pre blocks
          pre: ({ node, ...props }) => (
            <pre 
              {...props} 
              className="bg-muted p-3 rounded-lg overflow-x-auto my-2"
            />
          ),
          // Style blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote 
              {...props} 
              className="border-l-4 border-primary pl-4 italic text-muted-foreground my-2"
            />
          ),
          // Style lists
          ul: ({ node, ...props }) => (
            <ul {...props} className="list-disc list-inside my-2 space-y-1" />
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className="list-decimal list-inside my-2 space-y-1" />
          ),
          // Style headings
          h1: ({ node, ...props }) => <h1 {...props} className="text-lg font-bold my-2" />,
          h2: ({ node, ...props }) => <h2 {...props} className="text-base font-bold my-2" />,
          h3: ({ node, ...props }) => <h3 {...props} className="text-sm font-bold my-2" />,
          // Style paragraphs
          p: ({ node, ...props }) => <p {...props} className="my-2 leading-relaxed" />,
          // Style horizontal rules
          hr: ({ node }) => <hr className="my-4 border-border" />,
          // Style tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-2">
              <table {...props} className="w-full text-sm border-collapse" />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th {...props} className="bg-muted font-semibold px-3 py-2 border border-border" />
          ),
          td: ({ node, ...props }) => (
            <td {...props} className="px-3 py-2 border border-border" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MessageContent;

