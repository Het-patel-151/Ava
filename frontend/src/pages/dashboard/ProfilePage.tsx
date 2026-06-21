import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Calendar, MessageSquare, Mic, Bot, Crown, Mail, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { analyticsApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/utils';

interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  totalVoiceSessions: number;
  totalTokensUsed: number;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: () => analyticsApi.get().then((r) => r.data.data),
  });

  if (!user) return null;

  const plan = (user.subscription as { plan?: string } | undefined)?.plan || 'FREE';

  const stats = [
    { label: 'Conversations', value: analytics?.totalConversations ?? 0, icon: MessageSquare },
    { label: 'Messages', value: analytics?.totalMessages ?? 0, icon: MessageSquare },
    { label: 'Voice Sessions', value: analytics?.totalVoiceSessions ?? 0, icon: Mic },
    { label: 'Tokens Used', value: analytics ? `${(analytics.totalTokensUsed / 1000).toFixed(1)}k` : '0', icon: Bot },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* Hero card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass border-border/50 overflow-hidden">
          {/* Banner */}
          <div className="h-28 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600" />
          <CardContent className="pt-0 pb-6 px-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10">
              <div className="flex items-end gap-4">
                <UserAvatar
                  name={user.name}
                  avatar={user.avatar}
                  className="w-20 h-20 border-4 border-card text-xl"
                />
                <div className="mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    {user.emailVerified && (
                      <CheckCircle className="w-4 h-4 text-emerald-400" title="Verified" />
                    )}
                    <Badge variant={plan === 'FREE' ? 'secondary' : 'purple'} className="text-[10px]">
                      {plan === 'FREE' ? null : <Crown className="w-2.5 h-2.5 mr-1" />}
                      {plan}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/settings')}>
                Edit Profile
              </Button>
            </div>

            {/* Bio / location */}
            <div className="mt-4 space-y-2">
              {user.bio && <p className="text-sm text-muted-foreground">{user.bio}</p>}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {user.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Joined {formatDate(user.createdAt as string)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {stats.map(({ label, value, icon: Icon }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className="glass border-border/50">
              <CardContent className="p-5 text-center">
                <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-gradient">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Plan card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" /> Subscription Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg capitalize">{plan.toLowerCase()} Plan</p>
                <p className="text-sm text-muted-foreground">
                  {plan === 'FREE' ? 'Upgrade for unlimited access' : 'You have full access to all features'}
                </p>
              </div>
              {plan === 'FREE' && (
                <Button variant="gradient">Upgrade to Pro</Button>
              )}
            </div>
            {plan === 'FREE' && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {['Unlimited messages', 'Priority support', 'Advanced voice AI', 'Custom agents'].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {f}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
