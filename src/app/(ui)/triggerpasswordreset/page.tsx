"use client";

import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import NaeLoader from "@/components/nae-loader";
import PanelError from "@/components/panel-error";
import PanelHeader from "@/components/panel-header";
import { useAuth } from "@/context-providers/auth-context-provider";
import { triggerEmail } from "@/helpers/util/email-trigger";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, type SubmitEvent } from "react";
import toast from "react-hot-toast";

const TriggerPasswordResetPage = () => {

  const { user } = useAuth();

  const [sending, setSending] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [email, setEmail] = useState<string>("");
  const [prevUserId, setPrevUserId] = useState<string | undefined>(undefined);

  // If the user identity changed, update the email state immediately
  if (user?.id !== prevUserId) {
    setPrevUserId(user?.id);
    setEmail(user?.email || "");
  }
  
  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault();

    if (sending) return;

    setSent(false);
    setError('');

    if (email.length === 0) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await triggerEmail(email, "RESET", setSending);
      toast.success("Reset password email sent");
      setSent(true);
    } catch {
      setError('Failed to send reset password email');
    }
  }

  return (
    <div className="page-centered">
      <div className="max-w-md w-full">
        <div className="panel p-8">

          {/* Header */}
          <PanelHeader 
            title="Reset Password" 
            description="We'll send you an email with a link to update your password."
          />

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && <PanelError message={error} />}

              {/* Email Field */}
              <Input 
                id="email" 
                type="email"
                label="Email address"
                aria-label="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="you@example.com"
                disabled={sending}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={sending}
                className="w-full gap-2"
              >
                {sending ? (
                  <>
                    <NaeLoader />
                    Sending email...
                  </>
                ) : (
                  'Send Reset Password Link'
                )}
              </Button>
            </form>
          ) : (
            <div className="border-t border-panel-highlight pt-6">
              <div className="bg-panel-excellent border border-panel-excellent-border rounded-md p-4 mb-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-excellent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground-excellent mb-1">
                      Reset Password Email Sent
                    </p>
                    <p className="text-sm text-foreground-excellent">
                      We&apos;ve sent a new reset password link to{" "}
                      <span className="font-medium">
                        {email}
                      </span>
                      . Please check your inbox and click
                      the link to reset your password.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-foreground-secondary">
              <Link 
                href="/login"
                className="input-link"
              >
                Return to Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TriggerPasswordResetPage