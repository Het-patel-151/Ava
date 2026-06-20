import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Save, User, Bell, Shield, Mic, Globe, Moon, Sun, Monitor } from 'lucide-react';
import { settingsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useThemeStore } from '@/stores/theme.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/components/ui/toaster';

type Theme = 'light' | 'dark' | 'system';
type TabId = 'profile' | 'appearance' | 'voice' | 'notifications' | 'security';

interface Settings {
  theme?: string;
  language?: string;
  voiceEnabled?: boolean;
  voiceId?: string;
  voiceSpeed?: number;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  soundEnabled?: boolean;
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Monitor },
  { id: 'voice', label: 'Voice', icon: Mic },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

const VOICES = [
  { id: 'alloy', label: 'Alloy — neutral' },
  { id: 'echo', label: 'Echo — male' },
  { id: 'fable', label: 'Fable — British' },
  { id: 'onyx', label: 'Onyx — deep male' },
  { id: 'nova', label: 'Nova — female' },
  { id: 'shimmer', label: 'Shimmer — soft female' },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-muted'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const { theme, setTheme } = useThemeStore();
  const { user, updateUser } = useAuthStore();

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');

  // Password form state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');

  const { data: settings, refetch } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then((r) => r.data.data),
  });

  const [localSettings, setLocalSettings] = useState<Settings>({});
  useEffect(() => { if (settings) setLocalSettings(settings); }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Settings) => settingsApi.update(data as Record<string, unknown>),
    onSuccess: () => { toast.success('Settings saved'); refetch(); },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => settingsApi.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data.data);
      toast.success('Profile updated');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => settingsApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed');
      setCurrentPw(''); setNewPw('');
    },
    onError: () => toast.error('Current password is incorrect'),
  });

  const set = (key: keyof Settings, value: Settings[keyof Settings]) =>
    setLocalSettings((s) => ({ ...s, [key]: value }));

  const themeOptions: { value: Theme; icon: React.ElementType; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your preferences and account</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar tabs */}
        <nav className="flex md:flex-col gap-1 md:w-44 shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left ${
                activeTab === id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>

            {/* Profile */}
            {activeTab === 'profile' && (
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your display name and personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Bio</label>
                    <textarea
                      value={bio} onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Location</label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" icon={<Globe className="w-4 h-4" />} />
                  </div>
                  <Button
                    variant="gradient"
                    onClick={() => updateProfileMutation.mutate({ name, bio, location })}
                    loading={updateProfileMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Appearance */}
            {activeTab === 'appearance' && (
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how AVA looks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Theme</label>
                    <div className="flex gap-3">
                      {themeOptions.map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          onClick={() => setTheme(value)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                            theme === value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-3 block">Language</label>
                    <select
                      value={localSettings.language || 'en'}
                      onChange={(e) => set('language', e.target.value)}
                      className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {[['en','English'],['es','Spanish'],['fr','French'],['de','German'],['ja','Japanese'],['zh','Chinese']].map(([v,l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <Button variant="gradient" onClick={() => updateSettingsMutation.mutate(localSettings)} loading={updateSettingsMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" /> Save
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Voice */}
            {activeTab === 'voice' && (
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle>Voice Preferences</CardTitle>
                  <CardDescription>Configure AI voice output</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Enable Voice Responses</p>
                      <p className="text-xs text-muted-foreground">Hear AI responses out loud</p>
                    </div>
                    <Toggle value={!!localSettings.voiceEnabled} onChange={(v) => set('voiceEnabled', v)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Voice</label>
                    <div className="grid grid-cols-2 gap-2">
                      {VOICES.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => set('voiceId', v.id)}
                          className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                            localSettings.voiceId === v.id ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Speed: {localSettings.voiceSpeed ?? 1.0}×</label>
                    <input
                      type="range" min="0.5" max="2" step="0.1"
                      value={localSettings.voiceSpeed ?? 1.0}
                      onChange={(e) => set('voiceSpeed', parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                  <Button variant="gradient" onClick={() => updateSettingsMutation.mutate(localSettings)} loading={updateSettingsMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" /> Save
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Control what alerts you receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {[
                    { key: 'notificationsEnabled' as keyof Settings, label: 'Push Notifications', desc: 'In-app alerts' },
                    { key: 'emailNotifications' as keyof Settings, label: 'Email Notifications', desc: 'Updates via email' },
                    { key: 'soundEnabled' as keyof Settings, label: 'Sound Effects', desc: 'Audio feedback' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Toggle value={!!localSettings[key]} onChange={(v) => set(key, v)} />
                    </div>
                  ))}
                  <Button variant="gradient" onClick={() => updateSettingsMutation.mutate(localSettings)} loading={updateSettingsMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" /> Save
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Update your password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Current Password</label>
                    <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">New Password</label>
                    <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" />
                  </div>
                  <Button
                    variant="gradient"
                    onClick={() => changePasswordMutation.mutate({ currentPassword: currentPw, newPassword: newPw })}
                    loading={changePasswordMutation.isPending}
                    disabled={!currentPw || newPw.length < 8}
                  >
                    <Shield className="w-4 h-4 mr-2" /> Change Password
                  </Button>
                </CardContent>
              </Card>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  );
}
