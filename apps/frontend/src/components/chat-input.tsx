'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Send, Paperclip, X, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import gsap from 'gsap';

interface ChatInputProps {
  onSend: (message: string, files: File[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && files.length === 0) || isLoading) return;
    onSend(input, files);
    setInput('');
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const canSend = (input.trim() || files.length > 0) && !isLoading && !disabled;

  useEffect(() => {
    if (sendButtonRef.current) {
      gsap.to(sendButtonRef.current, {
        scale: canSend ? 1 : 0.95,
        duration: 0.15,
        ease: canSend ? 'back.out(1.7)' : 'power2.out',
      });
    }
  }, [canSend]);

  return (
    <form onSubmit={handleSubmit} className="px-4 py-4">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-muted/50 rounded-lg pl-3 pr-2 py-1.5 text-xs border border-border/40 animate-pop-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground/60" />
              <span className="max-w-[160px] truncate font-medium">{file.name}</span>
              <span className="text-muted-foreground/40">{formatFileSize(file.size)}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-0.5 p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="h-3 w-3 text-muted-foreground/50" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className={cn(
          'relative flex items-end gap-2 p-1.5 rounded-2xl border bg-background transition-all duration-300',
          isFocused ? 'border-primary/50 ring-2 ring-primary/20 shadow-lg' : 'border-input/60 shadow-sm'
        )}
      >
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask anything..."
            disabled={disabled || isLoading}
            rows={1}
            className={cn(
              'flex min-h-[44px] w-full rounded-xl bg-transparent px-4 py-[11px] text-[14px] placeholder:text-muted-foreground/40',
              'focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
              'max-h-32 overflow-y-auto'
            )}
            style={{
              height: 'auto',
              minHeight: '44px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
        </div>

        <div className="flex gap-1.5 pb-0.5 pr-0.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,application/json"
            onChange={handleFileSelect}
            multiple
            className="hidden"
            disabled={disabled || isLoading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
            className="flex-shrink-0 w-[40px] h-[40px] rounded-xl border border-transparent hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center group"
            title="Attach files"
          >
            <Paperclip className="h-[18px] w-[18px] text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors" />
          </button>
          <button
            ref={sendButtonRef}
            type="submit"
            disabled={!canSend}
            className={cn(
              'flex-shrink-0 w-[40px] h-[40px] rounded-xl flex items-center justify-center transition-all duration-200',
              canSend
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg hover:shadow-primary/20 active:scale-95'
                : 'bg-muted/40 text-muted-foreground/30 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
            ) : (
              <Send className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-2.5 text-[11px] text-muted-foreground/35 text-center flex items-center justify-center gap-1">
        <span>Press</span>
        <kbd className="px-1.5 py-0.5 rounded bg-muted/40 border border-border/20 font-mono text-[10px] text-muted-foreground/50">Enter</kbd>
        <span>to send</span>
      </div>
    </form>
  );
}

export { ChatInput };
