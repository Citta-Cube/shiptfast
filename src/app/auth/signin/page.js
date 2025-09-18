'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { signInAction } from '@/app/auth/actions';
import { Loader2 } from "lucide-react";

export default function SignIn() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (formData) => {
    setError('');
    startTransition(async () => {
      const result = await signInAction(formData);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background/50 to-background">
      <div className="relative w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <form action={handleSubmit} className="flex-1 flex flex-col min-w-64">
          <h1 className="text-2xl font-medium">Sign in</h1>
          <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
            <Label htmlFor="email">Email</Label>
            <Input 
              name="email" 
              placeholder="you@example.com" 
              required 
              id="email"
              type="email"
            />
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                className="text-xs text-foreground underline"
                onClick={() => router.push('/auth/forgot-password')}
              >
                Forgot Password?
              </button>
            </div>
            <Input
              type="password"
              name="password"
              placeholder="Your password"
              required
              id="password"
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground py-2 px-4 rounded mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Signing In...
                </>
              ) : (
                "Sign in"
              )}
            </button>
            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}
            <div className="text-sm text-center text-gray-500 mt-4">
              Don't have an account?{' '}
              <button
                type="button"
                className="text-primary underline p-0 bg-transparent"
                onClick={() => router.push('/auth/signup')}
              >
                Sign Up
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}