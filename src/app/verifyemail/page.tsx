"use client";

import Button from "@/components/nae-button";
import { getErrorMessage } from "@/helpers/error-message";
import { triggerEmail } from "@/helpers/trigger-email";
import User from "@/models/user-interface";
import axios from "axios";
import { BadgeCheck, Loader, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const VerifyEmailPage = () => {

  const [token, setToken] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    const urlToken = window.location.search.split("=")[1] as string;
    setToken(urlToken || "");
  }, [])

  useEffect(() => {
    if (token?.length > 0) {
      verifyUserEmail();
    }
  }, [token])

  const verifyUserEmail = async () => {
    try {
      await axios.post('/api/users/verifyemail', { token });
      setIsVerified(true);
    } catch (error: any) {
      setIsError(true);
      const message = getErrorMessage(error, "Email verification failed");
      console.error(message);
    }
  }

  const handleResendClick = async () => {
    if (isSendingEmail || isEmailSent) return;
    try {
      setIsSendingEmail(true);
      const res = await axios.get('/api/users/me');
      triggerEmail(res.data.user as User, "VERIFY", setIsSendingEmail);
      setIsEmailSent(true);
    }
    catch (error: unknown) {
      router.push("/login");
      return;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-8">
      {isVerified 
          ? (
            <BadgeCheck className="w-10 h-10 text-purple-600" />
          ) 
          : isError 
            ? (
              <ShieldAlert className="w-10 h-10 text-red-600" />
            ) 
            : (
              <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            )
      }
      <h1 className="mb-6 text-3xl font-bold">
        {isVerified ? 
          "Your email has been verified." 
          : isError ? 
            "Error verifying email" : 
            "Waiting for verification..."
        }
      </h1>
      {isError && !isEmailSent && (
        <Button
          onClick={handleResendClick}
        >
          Resend Email
        </Button>
      )}
      {isError && isEmailSent && (
        <p>Email sent.</p>
      )}
      <div className="pt-8">
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
    </div>
  )
}

export default VerifyEmailPage