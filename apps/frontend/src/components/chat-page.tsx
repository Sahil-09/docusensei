'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApi } from '@/lib/api-client';
import { useSmoothScroll } from '@/lib/use-smooth-scroll';
import { useChats } from '@/lib/chat-context';
import { ChatMessage } from '@/components/chat-message';
import { ChatInput } from '@/components/chat-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, FileText, Loader2, Sparkles, MessageSquare, Zap, BookOpen } from 'lucide-react';
import gsap from 'gsap';
import { UserButton } from '@clerk/nextjs';

interface Message {
  id?: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  isNew?: boolean;
}

interface Document {
  fileName: string;
}

interface ChatData {
  id: string;
  title: string;
  messages: Message[];
  documents: Document[];
}

function AnimatedEmptyState() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!iconRef.current || !titleRef.current || !descRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(iconRef.current, { opacity: 0, scale: 0.5, rotation: -10 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.6 })
      .fromTo(titleRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
      .fromTo(descRef.current, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.2');

    const cards = cardsRef.current?.children;
    if (cards && cards.length > 0) {
      tl.fromTo(Array.from(cards), { opacity: 0, y: 20, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.1 }, '-=0.2');
    }

    gsap.to(iconRef.current, {
      y: -5,
      duration: 2,
      ease: 'power1.inOut',
      repeat: -1,
      yoyo: true,
    });
  }, []);

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-auto px-6 pb-32">
      <div className="text-center max-w-md">
        <div ref={iconRef} className="relative mx-auto w-16 h-16 mb-6">
          <div className="absolute inset-0 bg-primary/10 rounded-2xl rotate-6 scale-110" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl animate-pulse" />
          <div className="relative w-16 h-16 bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl flex items-center justify-center border border-primary/15 shadow-lg shadow-primary/10">
            <Sparkles className="h-7 w-7 text-primary/70" />
          </div>
        </div>
        <h2 ref={titleRef} className="text-2xl font-semibold mb-3 tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          How can I help?
        </h2>
        <p ref={descRef} className="text-muted-foreground/60 text-[14px] leading-relaxed max-w-xs mx-auto mb-8">
          Upload documents and ask questions to get insights from your knowledge base.
        </p>
        <div ref={cardsRef} className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          <QuickActionCard icon={MessageSquare} title="Ask Questions" description="Query your docs" />
          <QuickActionCard icon={Zap} title="Get Insights" description="AI-powered analysis" />
          <QuickActionCard icon={BookOpen} title="Summarize" description="Key takeaways" />
          <QuickActionCard icon={FileText} title="Extract Info" description="Find specifics" />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      className="group relative p-4 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/30 hover:bg-muted/50 transition-all duration-300 cursor-pointer"
      onMouseEnter={() => {
        gsap.to(cardRef.current, { y: -2, duration: 0.2, ease: 'power2.out' });
      }}
      onMouseLeave={() => {
        gsap.to(cardRef.current, { y: 0, duration: 0.2, ease: 'power2.out' });
      }}
    >
      <div className="flex flex-col items-start">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-4 w-4 text-primary/70" />
        </div>
        <h3 className="text-[13px] font-medium mb-0.5">{title}</h3>
        <p className="text-[11px] text-muted-foreground/60">{description}</p>
      </div>
    </div>
  );
}

function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params?.chatId as string | undefined;

  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(!!chatId);

  const { postFile, streamAi, get } = useApi();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { scrollToBottom } = useSmoothScroll(scrollAreaRef);
  const { refreshChats } = useChats();

  useEffect(() => {
    if (chatId && chatId !== 'new') {
      loadChat(chatId);
      setCurrentChatId(chatId);
    } else {
      setMessages([]);
      setTitle('');
      setDocuments([]);
      setCurrentChatId(null);
      setIsInitialLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages, scrollToBottom]);

  const loadChat = async (id: string) => {
    setIsInitialLoading(true);
    try {
      const chatData: ChatData = await get(`/chats/${id}`);
      setTitle(chatData.title || 'Untitled Chat');
      setMessages(chatData.messages || []);
      setDocuments(chatData.documents || []);
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleSend = async (message: string, uploadedFiles: File[]) => {
    if (!message.trim() && uploadedFiles.length === 0) return;

    const userMessage: Message = {
      role: 'USER',
      content: message,
      isNew: true,
    };
    setMessages((prev) => [...prev, userMessage]);

    const formData = new FormData();
    uploadedFiles.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('message', message);
    if (currentChatId) {
      formData.append('chatId', currentChatId);
    }

    setIsLoading(true);

    try {
      const result = await postFile('/chats', formData);

      const responseStream = await streamAi('/genericFlow', {
        message: message,
        chatId: result.chatId,
        inputMessageId: result.messageId,
        role: 'ASSISTANT',
      });

      let isFirstChunk = true;
      for await (const chunk of responseStream.stream) {
        if (chunk.text) {
          if (isFirstChunk) {
            setMessages((prev) => [
              ...prev,
              {
                role: 'ASSISTANT',
                content: chunk.text,
                isNew: true,
              },
            ]);
            isFirstChunk = false;
          } else {
            setMessages((prev) => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1].content = chunk.text;
              return newMsgs;
            });
          }
        }
      }

      setMessages((prev) => prev.map((msg, idx) => (idx === prev.length - 1 ? { ...msg, isNew: false } : msg)));

      if (uploadedFiles.length > 0) {
        const chatData: ChatData = await get(`/chats/${result.chatId}`);
        setDocuments(chatData.documents || []);
      }
      if (!currentChatId && result.chatId) {
        setCurrentChatId(result.chatId);
        router.push(`/chat/${result.chatId}`);
        refreshChats();
      }
    } catch (error) {
      console.error('Streaming failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/50">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col min-w-0">
      <header className="flex-shrink-0 px-6 pt-5 pb-4 flex items-center justify-between min-h-[60px] gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-[15px] font-medium truncate">
            {title || 'New Chat'}
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {documents.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto max-w-[300px]">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-1.5 text-xs border border-border/40 flex-shrink-0"
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span className="max-w-[100px] truncate font-medium">
                    {doc.fileName}
                  </span>
                </div>
              ))}
            </div>
          )}
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
              },
            }}
          />
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          <AnimatedEmptyState />
        ) : (
          <ScrollArea ref={scrollAreaRef} className="flex-1 h-0 smooth-scroll">
            <div className="py-6">
              {messages.map((msg, index) => (
                <ChatMessage
                  key={index}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={
                    isLoading &&
                    index === messages.length - 1 &&
                    msg.role === 'ASSISTANT'
                  }
                  isNew={msg.isNew}
                />
              ))}
            </div>
            <div ref={messagesEndRef} className="h-4" />
          </ScrollArea>
        )}

        <div className="flex-shrink-0 relative pt-2">
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center pointer-events-none overflow-hidden">
            <div
              className="w-[500px] h-[200px] bg-primary/40 blur-[100px] rounded-full translate-y-[70%]"
              style={{ animation: 'glow-pulse 3s ease-in-out infinite' }}
            />
            <div
              className="absolute bottom-0 w-[350px] h-[100px] bg-primary/50 blur-[70px] rounded-full translate-y-[60%]"
              style={{ animation: 'glow-pulse 2s ease-in-out infinite 0.5s' }}
            />
          </div>
          <div className="relative bg-gradient-to-t from-background via-background/80 to-transparent pt-4 pb-2">
            <div className="max-w-2xl mx-auto">
              <ChatInput onSend={handleSend} isLoading={isLoading} />
            </div>
          </div>
          <button
            onClick={() => {
              throw new Error('Sentry Test');
            }}
          >
            break
          </button>
        </div>
      </main>
    </div>
  );
}

export { ChatPage };
