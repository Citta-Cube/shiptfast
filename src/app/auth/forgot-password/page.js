"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    setError("");
    setSuccess("");

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

      setSuccess("We sent a 6-digit code to your email.");
      setStep(2);
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage || err?.message || "Failed to send reset code";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCodeSubmit(e) {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const target = siResource || signIn;
      const res = await target.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
      });

      if (res.status === "needs_new_password") {
        setSuccess("Code verified. Please set your new password.");
        setStep(3);
      } else {
        setError("Invalid code or unexpected status.");
      }
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage || err?.message || "Invalid code";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (!isLoaded) return;
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const target = siResource || signIn;
      const res = await target.resetPassword({ password, signOutOfOtherSessions: true });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        router.push("/dashboard");
      } else {
        setError("Could not set new password. Please try again.");
      }
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage || err?.message || "Failed to set new password";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[420px] shadow-lg"> {/* Made slightly wider for OTP boxes */}
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
          <CardDescription className="text-center">
            {step === 1 && "Enter your email to receive a reset code"}
            {step === 2 && "Enter the 6-digit code sent to your email"}
            {step === 3 && "Set a new password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

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
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>
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
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Set New Password"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" className="text-sm text-gray-500" onClick={() => router.push("/auth/signin")}>
            Back to Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}