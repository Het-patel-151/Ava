import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mic, MessageSquare, Bot, BarChart3, ArrowRight, Sparkles, Zap, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, conversationApi } from '@/services/api';

const features = [
  { icon: Mic, title: 'Voice Assistant', desc: 'Real-time AI voice conversations', to: '/dashboard/voice', color: 'from-violet-500 to-purple-500' },
  { icon: MessageSquare, title: 'AI Chat', desc: 'Streaming text conversations', to: '/dashboard/chat', color: 'from-blue-500 to-cyan-500' },
  { icon: Bot, title: 'AI Agents', desc: 'Custom specialized assistants', to: '/dashboard/agents', color: 'from-emerald-500 to-teal-500' },
  { icon: BarChart3, title: 'Analytics', desc: 'Usage stats and insights', to: '/dashboard/analytics', color: 'from-orange-500 to-amber-500' },
];

const highlights = [
  { icon: Zap, title: 'Lightning Fast', desc: 'Powered by GPT-4o with streaming' },
  { icon: Shield, title: 'Private & Secure', desc: 'Your data stays yours' },
  { icon: Sparkles, title: 'Smart Context', desc: 'Remembers your conversations' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function HomePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: analytics } = useQuery({ queryKey: ['analytics'], queryFn: () => analyticsApi.get().then(r => r.data.data) });
  const { data: recentConvs } = useQuery({ queryKey: ['conversations', 'recent'], queryFn: () => conversationApi.list({ limit: 3 }).then(r => r.data.data) });

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="text-3xl font-bold">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          <span className="text-gradient">{firstName}</span> 👋
        </h1>
        <p className="text-muted-foreground">What would you like to do today?</p>
      </motion.div>

      {/* Quick stats */}
      {analytics && (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Conversations', value: analytics.totalConversations },
            { label: 'Messages', value: analytics.totalMessages },
            { label: 'Voice Sessions', value: analytics.totalVoiceSessions },
            { label: 'Tokens Used', value: (analytics.totalTokensUsed / 1000).toFixed(1) + 'k' },
          ].map((stat) => (
            <motion.div key={stat.label} variants={item}>
              <Card className="glass border-border/50">
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-gradient">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Feature cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map(({ icon: Icon, title, desc, to, color }) => (
          <motion.div key={to} variants={item}>
            <Card
              className="glass border-border/50 cursor-pointer group hover:border-primary/30 transition-all duration-200 hover:glow-sm"
              onClick={() => navigate(to)}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent conversations */}
      {recentConvs && recentConvs.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent Conversations</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/conversations')}>View all</Button>
          </div>
          <div className="space-y-2">
            {recentConvs.map((conv: { id: string; title: string; updatedAt: string }) => (
              <Card key={conv.id} className="glass border-border/50 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/dashboard/chat/${conv.id}`)}>
                <CardContent className="p-3 flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1 truncate">{conv.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(conv.updatedAt).toLocaleDateString()}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Highlights */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {highlights.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 p-4 rounded-xl glass border-border/30">
            <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
