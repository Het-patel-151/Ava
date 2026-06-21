import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Bot, User, Copy, RotateCcw, Trash2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import { conversationApi, messageApi } from '@/services/api';
import { toast } from '@/components/ui/toaster';
import { api } from '@/services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type: string;
  createdAt: string;
}

function MessageBubble({ message, onDelete }: { message: Message; onDelete: (id: string) => void }) {
  const { user } = useAuthStore();
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className="shrink-0 mt-1">
        {isUser ? (
          <UserAvatar name={user?.name || 'You'} avatar={user?.avatar} className="w-8 h-8" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'glass border-border/50 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              className="prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>pre]:bg-black/30 [&>pre]:rounded-lg [&>pre]:p-3 [&>code]:bg-black/30 [&>code]:px-1 [&>code]:rounded"
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => { navigator.clipboard.writeText(message.content); toast.success('Copied!'); }}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(message.id)}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StreamingMessage({ content }: { content: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0 mt-1">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="glass border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[75%]">
        <ReactMarkdown className="prose prose-sm prose-invert max-w-none">{content}</ReactMarkdown>
        <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse rounded-sm" />
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const { conversationId: paramId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { messages, streamingContent, isStreaming, setMessages, addMessage, appendStream, finalizeStream, setIsStreaming, setConversationId } = useChatStore();
  const [input, setInput] = useState('');
  const [convId, setConvId] = useState<string | null>(paramId || null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages when conversation selected
  useQuery({
    queryKey: ['messages', convId],
    queryFn: () => messageApi.list(convId!).then(r => r.data.data),
    enabled: !!convId,
    onSuccess: (data: Message[]) => setMessages(data),
  } as Parameters<typeof useQuery>[0]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (paramId) { setConvId(paramId); setConversationId(paramId); }
  }, [paramId, setConversationId]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => messageApi.delete(id),
    onSuccess: (_: unknown, id: string) => setMessages(messages.filter(m => m.id !== id)),
  });

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const content = input.trim();
    setInput('');

    // Ensure conversation
    let activeConvId = convId;
    if (!activeConvId) {
      const res = await conversationApi.create({ title: content.slice(0, 50) });
      activeConvId = res.data.data.id;
      setConvId(activeConvId);
      setConversationId(activeConvId);
      navigate(`/dashboard/chat/${activeConvId}`, { replace: true });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    }

    // Optimistic user message
    addMessage({ id: Date.now().toString(), role: 'user', content, type: 'TEXT', createdAt: new Date().toISOString() });
    setIsStreaming(true);

    try {
      const response = await fetch(`/api/messages/conversation/${activeConvId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('ava-auth') ? JSON.parse(localStorage.getItem('ava-auth')!).state.accessToken : ''}` },
        body: JSON.stringify({ content }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let messageId = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) appendStream(data.chunk);
            if (data.done) messageId = data.messageId;
          } catch {}
        }
      }

      finalizeStream(messageId || Date.now().toString());
      qc.invalidateQueries({ queryKey: ['conversations'] });
    } catch {
      toast.error('Failed to send message');
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between shrink-0 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-semibold">Chat</span>
          {convId && <span className="text-xs text-muted-foreground">· Active</span>}
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setMessages([]); setConvId(null); navigate('/dashboard/chat'); }}>
          <Plus className="w-4 h-4 mr-1" /> New Chat
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.length === 0 && !isStreaming && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center glow-primary">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Start a conversation</h2>
              <p className="text-muted-foreground text-sm mt-1">Ask me anything — I'm here to help.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 max-w-sm">
              {['Explain quantum computing', 'Write a Python script', 'Help me brainstorm ideas', 'Translate to Spanish'].map(s => (
                <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="text-xs text-left p-3 rounded-xl glass border-border/50 hover:border-primary/30 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} onDelete={(id) => deleteMutation.mutate(id)} />
          ))}
        </AnimatePresence>

        {isStreaming && streamingContent && <StreamingMessage content={streamingContent} />}
        {isStreaming && !streamingContent && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="glass rounded-2xl px-4 py-3 flex items-center gap-1">
              {[0, 0.2, 0.4].map((d) => (
                <motion.div key={d} className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
                  animate={{ y: [0, -6, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: d }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 p-4 shrink-0 bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AVA..."
            className="flex-1 h-11 rounded-xl"
            disabled={isStreaming}
          />
          <Button onClick={sendMessage} disabled={!input.trim() || isStreaming} variant="gradient" size="icon" className="h-11 w-11 rounded-xl shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">AVA can make mistakes. Consider checking important info.</p>
      </div>
    </div>
  );
}
