import { motion } from 'framer-motion';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, Lock, Sparkles, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/services/api';
import { toast } from '@/components/ui/toaster';

// Shared wrapper
function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background bg-gradient-mesh flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 mb-4 glow-primary">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">{title}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
        </div>
        <div className="glass rounded-2xl p-8">{children}</div>
      </motion.div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthCard title="Check your email" subtitle="We've sent you a reset link">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
          <p className="text-sm text-muted-foreground">If an account exists for <strong>{email}</strong>, you'll receive a reset link shortly.</p>
          <Link to="/auth/login"><Button variant="outline" className="w-full">Back to login</Button></Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot password" subtitle="Enter your email to reset your password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" icon={<Mail className="w-4 h-4" />} required />
        </div>
        <Button type="submit" className="w-full" variant="gradient" loading={loading}>Send Reset Link</Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/auth/login" className="text-primary hover:underline">Back to login</Link>
        </p>
      </form>
    </AuthCard>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const token = params.get('token') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password reset successfully');
      navigate('/auth/login');
    } catch {
      toast.error('Invalid or expired reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Reset password" subtitle="Choose a new password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">New Password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" icon={<Lock className="w-4 h-4" />} required minLength={8} />
        </div>
        <Button type="submit" className="w-full" variant="gradient" loading={loading}>Reset Password</Button>
      </form>
    </AuthCard>
  );
}

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const token = params.get('token');

  useState(() => {
    if (!token) { setStatus('error'); return; }
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  });

  return (
    <AuthCard
      title={status === 'success' ? 'Email verified!' : status === 'error' ? 'Verification failed' : 'Verifying...'}
      subtitle={status === 'verifying' ? 'Please wait' : status === 'success' ? 'Your email has been verified' : 'The link may be invalid or expired'}
    >
      <div className="text-center space-y-4">
        {status === 'verifying' && <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />}
        {status === 'success' && <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />}
        {status !== 'verifying' && (
          <Link to="/auth/login"><Button variant="gradient" className="w-full">Go to login</Button></Link>
        )}
      </div>
    </AuthCard>
  );
}

export default ForgotPasswordPage;
