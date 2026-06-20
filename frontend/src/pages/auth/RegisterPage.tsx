import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toaster';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include upper, lower and number'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: signup, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await signup(data.name, data.email, data.password);
      toast.success('Account created! Check your email to verify.');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-gradient-mesh flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 mb-4 glow-primary">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">Create account</h1>
          <p className="text-muted-foreground mt-2">Start talking with AVA today</p>
        </div>

        <div className="glass rounded-2xl p-8 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Full name</label>
              <Input {...register('name')} placeholder="John Doe" icon={<User className="w-4 h-4" />} error={errors.name?.message} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input {...register('email')} type="email" placeholder="you@example.com" icon={<Mail className="w-4 h-4" />} error={errors.email?.message} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
                error={errors.password?.message}
              />
            </div>
            <Button type="submit" className="w-full mt-2" variant="gradient" size="lg" loading={isLoading}>
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
