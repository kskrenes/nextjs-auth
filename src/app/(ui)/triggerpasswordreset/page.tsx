"use client";

import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import NaeLoader from "@/components/nae-loader";
import PanelError from "@/components/panel-error";
import PanelHeader from "@/components/panel-header";
import PanelSuccess from "@/components/panel-success";
import { useAuth } from "@/context-providers/auth-context-provider";
import { triggerEmail } from "@/helpers/util/email-trigger";
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
      // toast.error("Failed to send reset password email");
      setError('Failed to send reset password email');
    }
  }

  return (
    <div className="page-centered">
      <div className="max-w-md w-full">
        <div className="bg-panel rounded-lg p-8">

          {/* Header */}
          <PanelHeader 
            title="Password Reset" 
            description="We'll send you an email with instructions to update your password."
          />

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && <PanelError message={error} />}
            {/* Success Message */}
            {sent && <PanelSuccess message="An email has been sent!" />}

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
                'Send Email'
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-foreground-secondary">
              Return to{' '}
              <Link 
                href="/login"
                className="input-link"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TriggerPasswordResetPage