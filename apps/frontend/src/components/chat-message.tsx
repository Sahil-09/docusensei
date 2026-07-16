'use client';

import React, { memo, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import gsap from 'gsap';

interface ChatMessageProps {
  role: 'USER' | 'ASSISTANT';
  content: string;
  isStreaming?: boolean;
  isNew?: boolean;
}

const CodeBlock = memo(function CodeBlock({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const match = /language-(\w+)/.exec(className || '');
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const code = String(children).replace(/\n$/, '');
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!match) {
    return (
      <code className="bg-muted/60 px-1.5 py-0.5 rounded text-[13px] font-mono border border-border/30" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-5 -mx-1">
      <div className="absolute right-2.5 top-2.5 z-10">
        <Button
          variant="secondary"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={match[1]}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '0.625rem',
          fontSize: '0.8125rem',
        }}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
});

function StreamingText({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  const [displayedContent, setDisplayedContent] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content);
      return;
    }

    if (content.length > displayedContent.length) {
      setDisplayedContent(content);
    }
  }, [content, isStreaming, displayedContent.length]);

  useEffect(() => {
    if (!isStreaming && content) {
      setDisplayedContent(content);
    }
  }, [isStreaming, content]);

  return (
    <div ref={containerRef} className="prose prose-sm dark:prose-invert max-w-none leading-[1.7]">
      <ReactMarkdown
        components={{
          code: CodeBlock,
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {displayedContent}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 bg-primary/50 rounded-full ml-1 animate-pulse" />
      )}
    </div>
  );
}

function ChatMessage({ role, content, isStreaming, isNew }: ChatMessageProps) {
  const isUser = role === 'USER';
  const messageRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isNew && !hasAnimated && messageRef.current) {
      gsap.fromTo(
        messageRef.current,
        { opacity: 0, y: 20, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          ease: 'power3.out',
          onComplete: () => setHasAnimated(true),
        }
      );
    } else if (!isNew && messageRef.current) {
      gsap.set(messageRef.current, { opacity: 1, y: 0, scale: 1 });
    }
  }, [isNew, hasAnimated]);

  if (isUser) {
    return (
      <div ref={messageRef} className="group py-4 first:pt-0">
        <div className="flex gap-3 max-w-2xl mx-auto px-6 flex-row-reverse">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%]">
            <p className="text-[14px] leading-[1.6] whitespace-pre-wrap">{content}</p>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-primary-foreground/50 animate-pulse rounded-full ml-1" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={messageRef} className="group py-4 first:pt-0">
      <div className="flex gap-3 max-w-2xl mx-auto px-6">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="font-medium text-[11px] mb-2.5 text-muted-foreground/40 uppercase tracking-[0.08em]">
            Assistant
          </div>
          <StreamingText content={content} isStreaming={isStreaming || false} />
        </div>
      </div>
    </div>
  );
}

export { ChatMessage };
