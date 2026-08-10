import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { getAuthInstance, googleProvider } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

type Credentials = z.infer<typeof credentialsSchema>;

function firebaseErrorMessage(error: unknown): string {
  const code =
    error instanceof Error && 'code' in error
      ? (error as { code: string }).code
      : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error — please check your connection.';
    case 'auth/popup-closed-by-user':
      return '';
    default:
      return error instanceof Error ? error.message : 'Something went wrong.';
  }
}

export default function SignInPage() {
  const { syncError, sync } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Credentials>({
    resolver: standardSchemaResolver(credentialsSchema),
  });

  const handleGoogle = async () => {
    setSubmitError('');
    try {
      await signInWithPopup(getAuthInstance(), googleProvider);
    } catch (error) {
      const message = firebaseErrorMessage(error);
      if (message) setSubmitError(message);
    }
  };

  const handleEmail = handleSubmit(async (values) => {
    setSubmitError('');
    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(
          getAuthInstance(),
          values.email,
          values.password,
        );
      } else {
        await signInWithEmailAndPassword(
          getAuthInstance(),
          values.email,
          values.password,
        );
      }
    } catch (error) {
      const message = firebaseErrorMessage(error);
      if (message) setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
          Trust Care
        </span>
        <h1 className="mt-4 text-2xl font-semibold text-neutral-800">
          Trusted help, verified people
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Sign in to find a maid or nanny you can rely on.
        </p>
      </div>

      <Card className="space-y-4 p-6">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={handleGoogle}
          className="w-full"
        >
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span className="h-px flex-1 bg-neutral-200" />
          or
          <span className="h-px flex-1 bg-neutral-200" />
        </div>

        <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 rounded-lg px-3 py-1.5 transition-colors ${
              mode === 'signin' ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-600'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 rounded-lg px-3 py-1.5 transition-colors ${
              mode === 'signup' ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-600'
            }`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
          />
          {submitError && (
            <p className="text-sm text-danger" role="alert">
              {submitError}
            </p>
          )}
          <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        {syncError && (
          <p className="rounded-xl bg-danger/5 p-3 text-sm text-danger">
            Your account couldn&apos;t be linked to our server. Please retry.
          </p>
        )}
      </Card>

      {syncError && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => void sync()}
          className="mt-4 self-center"
        >
          Retry linking account
        </Button>
      )}
    </div>
  );
}
