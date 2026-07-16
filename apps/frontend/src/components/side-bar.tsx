'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useChats } from '@/lib/chat-context';
import { ScrollArea } from './ui/scroll-area';
import { ThemeToggle } from './theme-toggle';
import { MessageSquare, Plus, Trash2, Pencil, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import gsap from 'gsap';

interface Chat {
  id: string;
  title: string;
}

function SideBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { chats, removeChat, updateChat } = useChats();
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const containerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const chatItemsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const activeChatId = pathname?.startsWith('/chat/') ? pathname.replace('/chat/', '') : null;

  useEffect(() => {
    if (!containerRef.current || isLoaded) return;
    if (!logoRef.current || !buttonRef.current) return;

    const items = Array.from(chatItemsRef.current.values());
    
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(logoRef.current, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4 })
      .fromTo(buttonRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.2');

    if (items.length > 0) {
      tl.fromTo(
        items,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.05 },
        '-=0.1'
      );
    }

    setIsLoaded(true);
  }, [chats, isLoaded]);

  const handleNewChat = () => {
    router.push('/chat/new');
  };

  const handleSelectChat = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await removeChat(id);
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const handleRenameChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const chat = chats.find(c => c.id === id);
    if (!chat) return;
    
    const newTitle = prompt('Enter new title:', chat.title);
    if (newTitle && newTitle !== chat.title) {
      try {
        await updateChat(id, { title: newTitle });
      } catch (error) {
        console.error('Failed to rename chat:', error);
      }
    }
  };

  return (
    <aside ref={containerRef} className="fixed left-0 top-0 h-screen w-72 border-r border-border/40 bg-background flex flex-col z-20">
      <div className="px-5 pt-6 pb-4">
        <div ref={logoRef} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base tracking-tight">DocuSensei</span>
          </div>
          <ThemeToggle />
        </div>
        <button
          ref={buttonRef}
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </button>
      </div>

      <div className="px-3 py-2">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="px-2 py-2 text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em]">
          Conversations
        </div>
        <div className="space-y-0.5 pb-4">
          {chats.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground/50">No conversations yet</p>
            </div>
          ) : (
            chats.map((chat, index) => (
              <div
                key={chat.id}
                ref={(el) => {
                  if (el) chatItemsRef.current.set(chat.id, el);
                }}
                className={cn(
                  'group relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-all duration-200',
                  activeChatId === chat.id ? 'bg-accent shadow-sm' : 'hover:bg-accent/50'
                )}
                onClick={() => handleSelectChat(chat.id)}
                onMouseEnter={() => setHoveredChat(chat.id)}
                onMouseLeave={() => setHoveredChat(null)}
              >
                <MessageSquare className="h-[15px] w-[15px] flex-shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors" />
                <span className="truncate flex-1 text-[13px] leading-snug">{chat.title}</span>
                <div
                  className={cn(
                    'flex items-center gap-0.5 transition-opacity duration-150',
                    hoveredChat === chat.id ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <button
                    className="p-1.5 rounded-md hover:bg-background/80 transition-colors"
                    onClick={(e) => handleRenameChat(e, chat.id)}
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground/60" />
                  </button>
                  <button
                    className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground/60 hover:text-destructive" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="px-5 py-3 border-t border-border/40">
        <p className="text-[10px] text-muted-foreground/40 text-center">Powered by AI</p>
      </div>
    </aside>
  );
}

export { SideBar };
