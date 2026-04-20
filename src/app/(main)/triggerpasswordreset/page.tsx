"use client";

import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import NaeLoader from "@/components/nae-loader";
import { EmailIcon } from "@/components/profile-icons";
import { useAuth } from "@/context/AuthContext";
import { triggerEmail } from "@/helpers/trigger-email";
import { MailCheck, ShieldAlert } from "lucide-react";
import { useEffect, useState, type SubmitEvent } from "react";
import toast from "react-hot-toast";

const TriggerPasswordResetPage = () => {

  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    setEmail((prev) => prev || user.email);
  }, [user]);
  
  const handleReset = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault();

    if (isSending || email.length === 0) return;

    try {
      await triggerEmail(email, "RESET", setIsSending);
      toast.success("Reset password email sent");
      setIsSent(true);
    } catch (error: unknown) {
      toast.error("Failed to send reset password email");
      setIsError(true);
    }
  }

  const handleRetryClick = () => {
    setIsError(false);
    setIsSent(false);
  }

  return (
    <div className="pt-14 md:pt-24 mx-5 xs:mx-8 mb-8">

      {/* page title */}
      <h1 className="text-2xl min-w-39 max-w-90 font-semibold mx-auto md:mx-0 mb-8">My Password</h1>

      {/* page layout */}
      <div className="w-full xs:w-90 ll:flex-1 mx-auto md:mx-0">
        <div className="flex flex-col gap-8 max-w-150">
          {/* title panel */}
          <div 
            className="px-5 py-3 rounded-md bg-panel" 
          >
            <h2 className="text-lg font-semibold">Reset Password</h2>
          </div>
          <p className="text-foreground-secondary">We'll send you an email with instructions to update your password.</p>
          {isSent ? (
            <div className="flex flex-col items-center min-h-screen space-y-8">
              <MailCheck className="w-10 h-10 text-brand" />
              <h1 className="mb-6 text-3xl font-bold">An email has been sent.</h1>
              <p className="max-w-75 text-sm text-center text-foreground-secondary">
                Check your email for instructions you can follow to reset your password.
              </p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center min-h-screen space-y-8">
              <ShieldAlert className="w-10 h-10 text-red-600" />
              <h1 className="mb-6 text-3xl font-bold">Unable to send email</h1>
              <Button
                onClick={handleRetryClick}
                className="min-w-30 mt-4"
              >
                Retry
              </Button>
            </div>
          ) : (
            <form 
              className="flex flex-col max-w-md gap-8" 
              onSubmit={handleReset} 
            >
              {/* <h1 className="text-3xl font-semibold -mb-1">Reset Password</h1> */}
              <div className="flex items-center gap-2 w-full">
                <EmailIcon />
                <Input 
                  id="email" 
                  placeholder="email@example.com"
                  type="email"
                  aria-label="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-4 max-w-xs">
                <Button
                  type="submit"
                  disabled={isSending || email.length === 0}
                >
                  {isSending 
                    ? (
                      <>
                        <NaeLoader />
                        <span className="sr-only">Sending Email</span>
                      </>
                    )
                    : 'Send Reset Email'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default TriggerPasswordResetPage