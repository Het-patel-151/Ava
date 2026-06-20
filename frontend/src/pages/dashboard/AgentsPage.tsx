import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Bot, Plus, Pencil, Trash2, Globe, Lock } from 'lucide-react';
import { agentApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toaster';

interface Agent { id: string; name: string; description: string; systemPrompt: string; model: string; isPublic: boolean; isDefault: boolean; personality?: string; }

const DEFAULT_AGENTS = [
  { name: 'Coding Assistant', description: 'Expert programmer', systemPrompt: 'You are an expert software engineer. Help with code, debugging, and architecture.', personality: 'precise' },
  { name: 'Research Assistant', description: 'Deep researcher', systemPrompt: 'You are a meticulous researcher. Provide well-sourced, comprehensive analysis.', personality: 'analytical' },
  { name: 'Creative Writer', description: 'Creative storyteller', systemPrompt: 'You are a creative writing expert. Help craft compelling stories, poems, and content.', personality: 'creative' },
];

export default function AgentsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentApi.list().then(r => r.data.data as Agent[]),
  });

  const { register, handleSubmit, reset, setValue } = useForm<Omit<Agent, 'id' | 'isDefault'>>();

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => agentApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agents'] }); toast.success('Agent created'); setOpen(false); reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => agentApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agents'] }); toast.success('Agent updated'); setOpen(false); setEditing(null); reset(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agents'] }); toast.success('Agent deleted'); },
    onError: () => toast.error('Cannot delete default agent'),
  });

  const openEdit = (agent: Agent) => {
    setEditing(agent);
    setValue('name', agent.name);
    setValue('description', agent.description);
    setValue('systemPrompt', agent.systemPrompt);
    setValue('isPublic', agent.isPublic);
    setOpen(true);
  };

  const onSubmit = (data: Omit<Agent, 'id' | 'isDefault'>) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Agents</h1>
          <p className="text-sm text-muted-foreground">Create custom AI personas with specialized behaviors</p>
        </div>
        <Button variant="gradient" onClick={() => { setEditing(null); reset(); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New Agent
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent, i) => (
            <motion.div key={agent.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="glass border-border/50 hover:border-primary/30 transition-all h-full group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!agent.isDefault && (
                        <>
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(agent)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => deleteMutation.mutate(agent.id)} className="hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                  <CardDescription className="text-xs">{agent.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge variant="purple" className="text-[10px]">{agent.model}</Badge>
                    {agent.isDefault && <Badge variant="success" className="text-[10px]">Default</Badge>}
                    {agent.isPublic ? <Globe className="w-3 h-3 text-muted-foreground" /> : <Lock className="w-3 h-3 text-muted-foreground" />}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick-add presets */}
      {agents.length === 0 && !isLoading && (
        <div>
          <p className="text-sm text-muted-foreground mb-3 font-medium">Quick start with a preset:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DEFAULT_AGENTS.map(preset => (
              <button key={preset.name} onClick={() => createMutation.mutate({ ...preset, model: 'gpt-4o', isPublic: false })}
                className="text-left p-4 rounded-xl glass border-border/50 hover:border-primary/30 transition-colors">
                <p className="font-medium text-sm">{preset.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Agent' : 'Create Agent'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input {...register('name')} placeholder="e.g. Coding Assistant" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Input {...register('description')} placeholder="Brief description" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">System Prompt</label>
              <textarea
                {...register('systemPrompt')}
                placeholder="You are a helpful assistant specialized in..."
                rows={4}
                required
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="gradient" loading={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
