import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toaster';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-gradient-mesh flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 mb-4 glow-primary">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">Welcome back</h1>
          <p className="text-muted-foreground mt-2">Sign in to AVA</p>
        </div>

        {/* Form card */}
        <div className="glass rounded-2xl p-8 space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                autoComplete="current-password"
              />
            </div>

            <div className="text-right">
              <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" variant="gradient" size="lg" loading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card/50 px-2 text-muted-foreground">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {['Google', 'GitHub'].map((p) => (
              <Button key={p} variant="outline" size="sm" className="w-full" onClick={() => window.location.href = `/api/auth/${p.toLowerCase()}`}>
                {p}
              </Button>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/auth/register" className="text-primary font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
