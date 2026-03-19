"use client";

import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import { getErrorMessage } from "@/helpers/error-message";
import { triggerEmail } from "@/helpers/trigger-email";
import type NaeUser from "@/models/user-interface";
import axios from "axios";
import { Loader2, MailCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type SubmitEvent } from "react";
import toast from "react-hot-toast";

const TriggerPasswordResetPage = () => {

  const [user, setUser] = useState<NaeUser | null>(null);
  const [fetchingUser, setFetchingUser] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (fetchingUser) return;

    (async () => {
      try {
        setFetchingUser(true);
        const res = await axios.get('/api/users/me');
        const user = res.data.user as NaeUser
        setUser(user);
        setEmail(user.email);
      } catch (error: unknown) {
        const message = getErrorMessage(error, "Failed to fetch user");
        console.error(message);
      } finally {
        setFetchingUser(false);
      }
    })();
  }, [])

  if (fetchingUser) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader2 className='w-8 h-8 animate-spin text-purple-500' />
      </div>
    );
  }
  
  const handleReset = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault();

    if (isSending || email.length === 0) return;

    try {
      await triggerEmail(email, "RESET", setIsSending);  
      setIsSent(true);
    } catch (error: unknown) {
      setIsError(true);
    }
  }

  const handleRetryClick = () => {
    setIsError(false);
    setIsSent(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      {isSent ? (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-8">
          <MailCheck className="w-10 h-10 text-purple-600" />
          <h1 className="mb-6 text-3xl font-bold">An email has been sent.</h1>
          <p className="max-w-[300px] text-sm text-center">
            Check your email for instructions you can follow to reset your password.
          </p>
          <p className="text-xs">
            {'Go to '}
            <Link 
              href="/"
              className="text-purple-400 hover:text-purple-500 underline transition-colors"
            >
              home
            </Link>{' page.'}
          </p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-8">
          <ShieldAlert className="w-10 h-10 text-red-600" />
          <h1 className="mb-6 text-3xl font-bold">Unable to send email</h1>
          <Button
            onClick={handleRetryClick}
            className="min-w-[120px]"
          >
            Retry
          </Button>
          <p className="text-xs">
            {'Go to '}
            <Link 
              href="/login"
              className="text-purple-400 hover:text-purple-500 underline transition-colors"
            >
              Sign in
            </Link>{' page.'}
          </p>
        </div>
      ) : (
        <form 
          className="flex w-[300px] flex-col items-center py-2" 
          onSubmit={handleReset} 
        >
          <h1 className="mb-6 text-3xl font-bold">Reset Password</h1>
          <Input 
            id="email" 
            label="Email"
            placeholder="email@example.com"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="mt-4 mb-8">
            <Button
              type="submit"
              className="w-full"
              disabled={fetchingUser || isSending || email.length === 0}
            >
              {isSending 
                ? (
                  <>
                    <Loader2 className="w-7 h-7 animate-spin text-purple-400" aria-hidden="true" />
                    <span className="sr-only">Sending Email</span>
                  </>
                )
                : 'Send Reset Email'}
            </Button>
          </div>
          {user ? (
            <p className="text-xs">
              Return to{' '}
              <Link 
                href="/profile"
                className="text-purple-400 hover:text-purple-500 underline transition-colors"
              >
                profile page
              </Link>.
            </p>
          ) : (
            <p className="text-xs">
              Already have a password?{' '}
              <Link 
                href="/login"
                className="text-purple-400 hover:text-purple-500 underline transition-colors"
              >
                Sign in here
              </Link>.
            </p>
          )}
        </form>
      )}
    </div>
  )
}

export default TriggerPasswordResetPage