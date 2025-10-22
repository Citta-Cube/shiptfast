"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, X, Mail, Lock, Shield } from "lucide-react";
import { OTPInput } from "./otp-input"; 

export default function ForgotPassword() {
  const router = useRouter();
  const { isLoaded, signIn } = useSignIn();
  const { setActive } = useClerk();

  const [step, setStep] = useState(1);
  const [siResource, setSiResource] = useState(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleError = (err, defaultMessage) => {
    const errorMessage = err?.errors?.[0]?.longMessage || err?.message || defaultMessage;
    setError(errorMessage);
    setSuccess("");
    
    toast.error("Action Failed", {
      description: errorMessage,
      icon: <AlertCircle className="h-4 w-4" />,
      duration: 5000,
    });
  };

  const handleSuccess = (message, toastTitle = "Success") => {
    setSuccess(message);
    setError("");
    
    toast.success(toastTitle, {
      description: message,
      icon: <CheckCircle className="h-4 w-4" />,
      duration: 3000,
    });
  };

  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    clearMessages();

    try {
      // Initialize a sign-in instance for the identifier
      const si = await signIn.create({ identifier: email });
      setSiResource(si);

      // Prefer factor-provided emailAddressId for reset flow
      const factorEmailId = si?.supportedFirstFactors?.find(
        (f) => f?.strategy === "reset_password_email_code"
      )?.emailAddressId;
      // Fallback to matching user's known email addresses
      const userEmailId = si?.userData?.emailAddresses?.find(
        (ea) => ea?.emailAddress?.toLowerCase() === email.toLowerCase()
      )?.id;
      const emailAddressId = factorEmailId || userEmailId;

      if (!emailAddressId) {
        throw new Error("We couldn't start a reset for that email.");
      }

      // Prepare email code using same SignIn resource
      await si.prepareFirstFactor({
        strategy: "reset_password_email_code",
        emailAddressId,
      });

      handleSuccess("We sent a 6-digit code to your email.", "Code Sent");
      setStep(2);
    } catch (err) {
      handleError(err, "Failed to send reset code");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCodeSubmit(e) {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    clearMessages();

    try {
      const target = siResource || signIn;
      const res = await target.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
      });

      if (res.status === "needs_new_password") {
        handleSuccess("Code verified. Please set your new password.", "Code Verified");
        setStep(3);
      } else {
        throw new Error("Invalid code or unexpected status.");
      }
    } catch (err) {
      handleError(err, "Invalid code");
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    clearMessages();

    try {
      const target = siResource || signIn;
      const res = await target.resetPassword({ password, signOutOfOtherSessions: true });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        handleSuccess("Password updated successfully! Redirecting to dashboard...", "Password Reset Complete");
        
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        throw new Error("Could not set new password. Please try again.");
      }
    } catch (err) {
      handleError(err, "Failed to set new password");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background/50 to-background">
      <Card className="w-[420px] shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
          <CardDescription className="text-center">
            {step === 1 && "Enter your email to receive a reset code"}
            {step === 2 && "Enter the 6-digit code sent to your email"}
            {step === 3 && "Set a new password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Code"}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="block text-center">Verification Code</Label>
                <OTPInput
                  value={code}
                  onChange={setCode}
                  length={6}
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center justify-between">
                <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={isLoading}>
                  Back
                </Button>
                <Button type="submit" disabled={isLoading || code.length !== 6}>
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <Button type="button" variant="ghost" onClick={() => setStep(2)} disabled={isLoading}>
                  Back
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Set New Password"}
                </Button>
              </div>
            </form>
          )}

          {/* Enhanced Error Message with Red Background */}
          {error && (
            <div className="mt-4 p-4 bg-red-600 rounded-lg border border-red-500 relative">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-sm mb-1">
                    {step === 1 && "Failed to Send Code"}
                    {step === 2 && "Code Verification Failed"}
                    {step === 3 && "Password Update Failed"}
                  </h4>
                  <p className="text-white text-sm leading-relaxed">
                    {error}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearMessages}
                  className="text-white hover:text-red-200 transition-colors p-1 rounded-full hover:bg-red-700"
                  aria-label="Close error message"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Success Message with Green Background */}
          {success && (
            <div className="mt-4 p-4 bg-green-600 rounded-lg border border-green-500">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {step === 1 && <Mail className="h-5 w-5 text-white" />}
                  {step === 2 && <Shield className="h-5 w-5 text-white" />}
                  {step === 3 && <Lock className="h-5 w-5 text-white" />}
                </div>
                <p className="text-white text-sm font-medium">
                  {success}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="link" 
            className="text-sm text-gray-500" 
            onClick={() => router.push("/auth/signin")}
            disabled={isLoading}
          >
            Back to Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}