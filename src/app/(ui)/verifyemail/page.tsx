"use client";

import NaeLoader from "@/components/nae-loader";
import { useAuth } from "@/context-providers/auth-context-provider";
import axios from "axios";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ResendTokenEmailForm from "@/components/resend-token-email-form";

type VerificationState = 'loading' | 'success' | 'error';
type ErrorType = 'no_token' | 'invalid_token'| 'server_error';

const VerifyEmailPage = () => {

  // get the url token when page loads
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [verificationState, setVerificationState] = useState<VerificationState>('loading');
  const [errorType, setErrorType] = useState<ErrorType | null>(null);

  const { verifyEmail } = useAuth();

  // verify email when token is available
  useEffect(() => {
    if (!token) {
      // can't set state synchronously here
      (async () => {
        setVerificationState('error');
        setErrorType('no_token');
      })();
      return;
    }

    (async () => {
      try {
        await verifyEmail(token);
        setVerificationState('success');
      } catch (error: unknown) {
        setVerificationState('error');
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        setErrorType(status === 400 ? 'invalid_token' : 'server_error');
      }
    })();
  }, [verifyEmail, token]);

  const getVerificationErrorMessage = (): {
    title: string;
    description: string;
  } => {
    switch (errorType) {
      case "no_token":
        return {
          title: "Verification Link Required",
          description:
            "Please use the verification link sent to your email address.",
        };
      case "invalid_token":
        return {
          title: "Invalid Verification Link",
          description:
            "This verification link is invalid or expired. Please request a new one.",
        };
      case "server_error":
        return {
          title: "Verification Failed",
          description:
            "An unexpected error occurred. Please try again later or request a new verification link.",
        };
      default:
        return {
          title: "Verification Failed",
          description:
            "Something went wrong. Please try again.",
        };
    }
  };

  return (
    <div className="page-centered">
      <div className="max-w-md w-full">
        <div className="bg-panel rounded-lg p-8">

          {/* Loading State */}
          {verificationState === 'loading' && (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="p-4 bg-panel-brand rounded-full">
                  <NaeLoader className="w-12 h-12" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">
                Verifying Your Email
              </h1>
              <p className="text-sm text-foreground-secondary">
                Please wait while we verify your email
                address...
              </p>
            </div>
          )}

          {/* Success State */}
          {verificationState === 'success' && (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="p-4 bg-panel-excellent rounded-full">
                  <CheckCircle2 className="w-12 h-12 text-foreground-excellent" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">
                Email Verified!
              </h1>
              <p className="text-sm text-foreground-secondary mb-8">
                Your email address has been successfully
                verified. You can now sign in to your account.
              </p>
              <Link 
                href="/login" 
                className="w-full button-primary button-standard" 
              >
                Go to Sign In
              </Link>
            </div>
          )}
          
          {/* Error State */}
          {verificationState === "error" && (
            <div>
              <div className="text-center mb-8">
                <div className="mb-6 flex justify-center">
                  <div className="p-4 bg-panel-poor rounded-full">
                    <XCircle className="w-12 h-12 text-poor" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold mb-2">
                  {getVerificationErrorMessage().title}
                </h1>
                <p className="text-sm text-foreground-secondary">
                  {getVerificationErrorMessage().description}
                </p>
              </div>

              {/* Resend Verification Form */}
              <ResendTokenEmailForm emailType="VERIFY" />

              {/* Back to Sign In Link */}
              <div className="mt-6 text-center">
                <Link 
                  href="/login"
                  className="input-link"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage