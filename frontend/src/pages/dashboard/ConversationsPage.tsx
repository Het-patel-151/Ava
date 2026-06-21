import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Star, Pin, Trash2, Search, Archive } from 'lucide-react';
import { conversationApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';
import { formatRelativeTime } from '@/lib/utils';
import { useState } from 'react';

interface Conversation {
  id: string;
  title: string;
  isStarred: boolean;
  isPinned: boolean;
  updatedAt: string;
  messages?: { content: string }[];
}

export default function ConversationsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['conversations', search],
    queryFn: () => conversationApi.list({ search, limit: 50 }).then(r => r.data.data as Conversation[]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => conversationApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['conversations'] }); toast.success('Deleted'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => conversationApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Conversations</h1>
        <Button variant="gradient" onClick={() => navigate('/dashboard/chat')}>New Chat</Button>
      </div>

      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..." icon={<Search className="w-4 h-4" />} />

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {data?.map((conv, i) => (
            <motion.div key={conv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="glass border-border/50 hover:border-primary/30 transition-all group cursor-pointer" onClick={() => navigate(`/dashboard/chat/${conv.id}`)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{conv.title}</p>
                      {conv.isPinned && <Badge variant="purple" className="text-[10px] py-0">Pinned</Badge>}
                      {conv.isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(conv.updatedAt)}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon-sm" onClick={() => updateMutation.mutate({ id: conv.id, data: { isStarred: !conv.isStarred } })}>
                      <Star className={`w-3.5 h-3.5 ${conv.isStarred ? 'text-amber-400 fill-amber-400' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => updateMutation.mutate({ id: conv.id, data: { isPinned: !conv.isPinned } })}>
                      <Pin className={`w-3.5 h-3.5 ${conv.isPinned ? 'text-primary' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => deleteMutation.mutate(conv.id)} className="hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {data?.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Archive className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No conversations yet</p>
              <Button variant="gradient" className="mt-4" onClick={() => navigate('/dashboard/chat')}>Start your first chat</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
