"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/form-message";

export default function SignInPage() {
  const router = useRouter();
  const { isLoaded, signIn } = useSignIn();
  const { setActive } = useClerk();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ error: null, success: null });

  async function onSubmit(e) {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    setMessage({ error: null, success: null });
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "needs_second_factor") {
        setMessage({ error: "Two-factor authentication required. Please complete the second factor.", success: null });
      } else if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else if (result.status === "needs_new_password") {
        router.push("/auth/forgot-password");
      } else {
        setMessage({ error: "Unable to sign in. Please check your credentials.", success: null });
      }
    } catch (err) {
      const errMsg = err?.errors?.[0]?.longMessage || err?.message || "Sign in failed";
      setMessage({ error: errMsg, success: null });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background/50 to-background">
      <div className="relative w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <form className="flex-1 flex flex-col min-w-64" onSubmit={onSubmit}>
          <h1 className="text-2xl font-medium">Sign in</h1>
          <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <Link className="text-xs text-foreground underline" href="/auth/forgot-password">
                Forgot Password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
            <SubmitButton pendingText="Signing In..." isLoading={isLoading}>
              Sign in
            </SubmitButton>
            <FormMessage message={message} />
          </div>
        </form>
      </div>
    </div>
  );
}