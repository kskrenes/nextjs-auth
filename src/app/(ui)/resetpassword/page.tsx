"use client";

import Button from "@/components/nae-button";
import NaeLoader from "@/components/nae-loader";
import SetPasswordInputs from "@/components/nae-set-password";
import PanelError from "@/components/panel-error";
import PanelHeader from "@/components/panel-header";
import ResendTokenEmailForm from "@/components/resend-token-email-form";
import { useAuth } from "@/context-providers/auth-context-provider";
import { getValidPassword } from "@/helpers/util/form-validation-utils";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type SubmitEvent } from "react";

type ResetState = 'idle' | 'loading' | 'success' | 'error';
type ErrorType = 'no_token' | 'invalid_token'| 'server_error';

const ResetPasswordPage = () => {

  // get the url token when page loads
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [resetState, setResetState] = useState<ResetState>('idle')
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const { resetPassword } = useAuth();

  // set error state if url token is missing
  useEffect(() => {
    if (!token) {
      // can't set state synchronously here
      (async () => {
        setErrorType('no_token');
        setResetState('error');
      })();
      return;
    }
  }, [token]);

  const getResetErrorMessage = (): {
    title: string;
    description: string;
  } => {
    switch (errorType) {
      case "no_token":
        return {
          title: "Reset Link Required",
          description:
            "Please use the password reset link sent to your email address.",
        };
      case "invalid_token":
        return {
          title: "Invalid Reset Link",
          description:
            "This reset password link is invalid or expired. Please request a new one.",
        };
      case "server_error":
        return {
          title: "Reset Failed",
          description:
            "An unexpected error occurred. Please try again later or request a new password reset link.",
        };
      default:
        return {
          title: "Reset Failed",
          description:
            "Something went wrong. Please try again.",
        };
    }
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault();

    if (resetState === 'loading') return;

    setValidationError('');

    if (!token) {
      setErrorType('no_token');
      setResetState('error');
      return;
    }

    // Password validation
    if (!newPassword || !confirmPassword) {
      setValidationError("Please enter and confirm a new password");
      return;
    }

    let validPassword;
    try {
      validPassword = getValidPassword(newPassword, confirmPassword);
    } catch (error: unknown) {
      setValidationError((error as Error).message);
      return;
    }

    setResetState('loading');

    try {
      await resetPassword(token, validPassword);
      setResetState('success');
    } 
    catch (error: unknown) {
      const status = (error as { response?: { status?: number } }).response?.status;
      setErrorType(status === 410 ? 'invalid_token' : 'server_error');
      setResetState('error');
    }
  }
  
  return (
    <div className="page-centered">
      <div className="max-w-md w-full">
        <div className="panel p-8">

          {/* Idle & Loading State */}
          {(resetState === 'idle' || resetState === 'loading') && (
            <div>
              <PanelHeader 
                title="Reset Password" 
                description="Submit a password. You'll be logged out of all devices, and you can sign in with your new password."
              />

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Message */}
                {validationError && <PanelError message={validationError} />}

                {/* Password Fields */}
                <SetPasswordInputs 
                  label="New Password"
                  password={newPassword}
                  confirmPassword={confirmPassword}
                  onPasswordChange={(val) => {
                    setNewPassword(val);
                    if (validationError) setValidationError('');
                  }}
                  onConfirmPasswordChange={(val) => {
                    setConfirmPassword(val);
                    if (validationError) setValidationError('');
                  }}
                  disabled={resetState === 'loading'}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={resetState === 'loading'}
                  className="w-full gap-2"
                >
                  {resetState === 'loading' ? (
                    <>
                      <NaeLoader />
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
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

          {/* Success State */}
          {resetState === 'success' && (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="p-4 bg-panel-excellent rounded-full">
                  <CheckCircle2 className="w-12 h-12 text-foreground-excellent" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">
                Password Reset!
              </h1>
              <p className="text-sm text-foreground-secondary mb-8">
                Your password has been successfully
                reset. You can now sign in to your account.
              </p>
              <Button 
                className="w-full"
                onClick={() => {window.location.replace('/login')}}
              >
                Go to Sign In
              </Button>
            </div>
          )}

          {/* Error State */}
          {resetState === "error" && (
            <div>
              <div className="text-center mb-8">
                <div className="mb-6 flex justify-center">
                  <div className="p-4 bg-panel-poor rounded-full">
                    <XCircle className="w-12 h-12 text-poor" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold mb-2">
                  {getResetErrorMessage().title}
                </h1>
                <p className="text-sm text-foreground-secondary">
                  {getResetErrorMessage().description}
                </p>
              </div>

              {/* Resend Reset Email Form */}
              <ResendTokenEmailForm emailType="RESET" />

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

export default ResetPasswordPage