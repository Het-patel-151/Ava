import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Bot, Plus, Pencil, Trash2, Globe, Lock, Cpu } from 'lucide-react';
import { agentApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toaster';

interface Agent { id: string; name: string; description: string; systemPrompt: string; model: string; isPublic: boolean; isDefault: boolean; personality?: string; }

// 100% free Ollama models
const FREE_MODELS = [
  { value: 'llama3.2',    label: 'Llama 3.2 (3B) — fast, default',   size: '2GB'  },
  { value: 'llama3.1',    label: 'Llama 3.1 (8B) — smarter',         size: '5GB'  },
  { value: 'mistral',     label: 'Mistral 7B — great all-rounder',    size: '4GB'  },
  { value: 'gemma2',      label: 'Gemma 2 (9B) — Google',             size: '6GB'  },
  { value: 'phi3',        label: 'Phi-3 Mini — very fast',            size: '2GB'  },
  { value: 'qwen2.5',     label: 'Qwen 2.5 (7B) — multilingual',     size: '5GB'  },
  { value: 'deepseek-r1', label: 'DeepSeek R1 — reasoning',           size: '5GB'  },
];

const PRESETS = [
  { name: 'Coding Assistant',  description: 'Expert programmer',         systemPrompt: 'You are an expert software engineer. Help with code, debugging, and architecture. Always provide working examples.', personality: 'precise'    },
  { name: 'Research Scholar',  description: 'Deep analytical researcher', systemPrompt: 'You are a meticulous researcher. Provide structured, comprehensive analysis with clear explanations.',              personality: 'analytical' },
  { name: 'Creative Writer',   description: 'Storyteller & writing coach',systemPrompt: 'You are a creative writing expert. Help craft stories, poems, and marketing copy in any style or genre.',            personality: 'creative'   },
];

export default function AgentsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentApi.list().then(r => r.data.data as Agent[]),
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<Omit<Agent, 'id' | 'isDefault'>>({
    defaultValues: { model: 'llama3.2', isPublic: false },
  });

  const selectedModel = watch('model');

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => agentApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agents'] }); toast.success('Agent created'); setOpen(false); reset(); },
    onError: () => toast.error('Failed to create agent'),
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
    setValue('model', agent.model);
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
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            Powered by Ollama — 100% free, runs locally
          </p>
        </div>
        <Button variant="gradient" onClick={() => { setEditing(null); reset({ model: 'llama3.2', isPublic: false }); setOpen(true); }}>
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
                <CardContent className="pt-0 flex flex-wrap gap-1.5">
                  <Badge variant="success" className="text-[10px]">🆓 {agent.model}</Badge>
                  {agent.isDefault && <Badge variant="purple" className="text-[10px]">Built-in</Badge>}
                  {agent.isPublic ? <Globe className="w-3 h-3 text-muted-foreground" /> : <Lock className="w-3 h-3 text-muted-foreground" />}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {agents.length === 0 && !isLoading && (
        <div>
          <p className="text-sm text-muted-foreground mb-3 font-medium">Quick-start presets:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESETS.map(preset => (
              <button key={preset.name} onClick={() => createMutation.mutate({ ...preset, model: 'llama3.2', isPublic: false })}
                className="text-left p-4 rounded-xl glass border-border/50 hover:border-primary/30 transition-colors">
                <p className="font-medium text-sm">{preset.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

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
              <textarea {...register('systemPrompt')} placeholder="You are a helpful assistant specialized in..." rows={4} required
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Model <span className="text-emerald-400 text-xs">(all free)</span></label>
              <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {FREE_MODELS.map(m => (
                  <label key={m.value} className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${selectedModel === m.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                    <div className="flex items-center gap-2">
                      <input type="radio" {...register('model')} value={m.value} className="accent-primary" />
                      <span>{m.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{m.size}</span>
                  </label>
                ))}
              </div>
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
