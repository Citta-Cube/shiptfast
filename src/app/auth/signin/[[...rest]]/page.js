"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/form-message";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, X } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const { isLoaded, signIn } = useSignIn();
  const { setActive } = useClerk();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ error: null, success: null });

  // Enhanced error handling with better user feedback
  const handleError = (error) => {
    let errorMessage = "Sign in failed. Please try again.";
    
    if (error?.errors?.[0]) {
      const clerkError = error.errors[0];
      switch (clerkError.code) {
        case "form_identifier_not_found":
          errorMessage = "No account found with this email address.";
          break;
        case "form_password_incorrect":
          errorMessage = "Incorrect password. Please try again.";
          break;
        case "form_identifier_exists":
          errorMessage = "An account with this email already exists.";
          break;
        case "too_many_requests":
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        case "session_token_revoked":
          errorMessage = "Your session has expired. Please sign in again.";
          break;
        default:
          errorMessage = clerkError.longMessage || clerkError.message || errorMessage;
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }

    setMessage({ error: errorMessage, success: null });
    
    // Show toast notification for errors
    toast.error("Sign In Failed", {
      description: errorMessage,
      icon: <AlertCircle className="h-4 w-4" />,
      duration: 5000,
    });
  };

  const handleSuccess = () => {
    setMessage({ error: null, success: "Successfully signed in! Redirecting..." });
    
    // Show success toast
    toast.success("Welcome back!", {
      description: "You have been successfully signed in.",
      icon: <CheckCircle className="h-4 w-4" />,
      duration: 3000,
    });
  };

  const clearError = () => {
    setMessage({ error: null, success: null });
  };

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
        const errorMsg = "Two-factor authentication required. Please complete the second factor.";
        setMessage({ error: errorMsg, success: null });
        toast.warning("Additional Verification Required", {
          description: errorMsg,
          duration: 5000,
        });
      } else if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        handleSuccess();
        
        // Wait for Clerk to fully hydrate before redirecting
        // This ensures the header component receives the user data immediately
        // Use router.refresh() to ensure server components get fresh session data
        setTimeout(() => {
          // Refresh the router to ensure all server components are updated with new session
          router.refresh();
          
          // Additional delay to allow Clerk hooks to fully hydrate on client side
          setTimeout(() => {
            router.push("/dashboard");
          }, 500);
        }, 800);
      } else if (result.status === "needs_new_password") {
        toast.info("Password Reset Required", {
          description: "You need to reset your password before continuing.",
          duration: 4000,
        });
        router.push("/auth/forgot-password");
      } else {
        const errorMsg = "Unable to sign in. Please check your credentials.";
        setMessage({ error: errorMsg, success: null });
        toast.error("Sign In Failed", {
          description: errorMsg,
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
    } catch (err) {
      handleError(err);
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
            <SubmitButton pendingText="Signing In..." isLoading={isLoading}>
              Sign in
            </SubmitButton>
            
            {/* Enhanced Error Message with Red Background */}
            {message.error && (
              <div className="mt-4 p-4 bg-red-600 rounded-lg border border-red-500 relative">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-sm mb-1">Sign In Failed</h4>
                    <p className="text-white text-sm leading-relaxed">
                      {message.error}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearError}
                    className="text-white hover:text-red-200 transition-colors p-1 rounded-full hover:bg-red-700"
                    aria-label="Close error message"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Success Message with Green Background */}
            {message.success && (
              <div className="mt-4 p-4 bg-green-600 rounded-lg border border-green-500">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-white flex-shrink-0" />
                  <p className="text-white text-sm font-medium">
                    {message.success}
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}