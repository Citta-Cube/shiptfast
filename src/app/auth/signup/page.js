'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from '@/app/auth/actions';
import { Loader2 } from "lucide-react";

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      await signup(formData);
      // If signup is successful, the server action will handle the redirect
    } catch (error) {
      setError(error.message || 'An error occurred during signup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background/50 to-background">
      <div className="relative w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-w-64">
          <h1 className="text-2xl font-medium">Sign up</h1>
          <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground py-2 px-4 rounded mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Signing Up...
                </>
              ) : (
                "Sign up"
              )}
            </button>
            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}
            <div className="text-sm text-center text-gray-500 mt-4">
              Already have an account?{' '}
              <button
                type="button"
                className="text-primary underline p-0 bg-transparent"
                onClick={() => router.push('/auth/signin')}
              >
                Sign In
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}