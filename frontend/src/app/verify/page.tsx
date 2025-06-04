"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api";

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"start" | "sent" | "verifying">("start");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("pendingVerificationEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleSendEmail = async () => {
    setLoading(true);
    setError(null);
    try {
      await authApi.sendVerificationEmail(email);
      setStep("sent");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send verification email.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      await authApi.verifyEmailCode(code);
      setSuccess(true);
      localStorage.removeItem("pendingVerificationEmail");
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid code. Please try again or resend email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Verify your email</h1>
        <p className="text-muted-foreground mb-6">
          To continue, please verify your email address: <b>{email}</b>
        </p>
        {step === "start" && (
          <Button onClick={handleSendEmail} disabled={loading} className="w-full h-9" size="sm">
            {loading ? "Sending..." : "Send verification email"}
          </Button>
        )}
        {step === "sent" && (
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button onClick={handleVerify} disabled={loading || !code} className="w-full h-9" size="sm">
              {loading ? "Verifying..." : "Verify"}
            </Button>
            <div className="mt-2">
              <Button onClick={handleSendEmail} disabled={loading} className="w-full h-9" size="sm">
                Resend email
              </Button>
            </div>
          </div>
        )}
        {error && <div className="text-red-500 text-sm mt-4">{error}</div>}
        {success && <div className="text-green-600 text-sm mt-4">Email verified! Redirecting...</div>}
      </div>
    </div>
  );
} 