"use client";

import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import NaeLoader from "@/components/nae-loader";
import SetPasswordInputs from "@/components/nae-set-password";
import PanelError from "@/components/panel-error";
import PanelHeader from "@/components/panel-header";
import { useAuth } from "@/context-providers/auth-context-provider";
import { triggerEmail } from "@/helpers/util/email-trigger";
import { getValidPassword } from "@/helpers/util/form-validation-utils";
import { CheckCircle2, Mail, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type SubmitEvent } from "react";

type ResetState = 'idle' | 'loading' | 'success' | 'error';
type ErrorType = 'no_token' | 'invalid_token'| 'server_error';

const ResetPasswordPage = () => {

  const [resetState, setResetState] = useState<ResetState>('idle')
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<boolean>(false);
  const [resendError, setResendError] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [token, setToken] = useState<string>("");

  const { resetPassword } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (!urlToken) {
      (async () => {
        setErrorType('no_token');
        setResetState('error');
      })();
      return;
    }

    (async () => {
      setToken(urlToken);
    })();
  }, []);

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
    catch {
      setErrorType('server_error');
      setResetState('error');
    }
  }
  
  const handleResendVerification = async (
    e: SubmitEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setResendError("");
    setResendSuccess(false);

    if (!email) {
      setResendError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setResendError("Please enter a valid email address");
      return;
    }

    setIsResending(true);

    try {
      await triggerEmail(email, "RESET");
      setResendSuccess(true);
    } catch {
      setResendError("There was a problem sending the link");
    } finally {
      setIsResending(false);
    }
  };
  
  return (
    <div className="page-centered">
      <div className="max-w-md w-full">
        <div className="bg-panel rounded-lg p-8">

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

              {/* Resend Verification Form */}
              {!resendSuccess ? (
                <div className="border-t border-panel-highlight pt-6">
                  <div className="mb-4 flex items-center gap-2 text-sm text-foreground-secondary">
                    <Mail className="w-4 h-4" />
                    <span className="font-medium">
                      Request a new reset password link
                    </span>
                  </div>

                  <form
                    onSubmit={handleResendVerification}
                    className="space-y-4"
                  >
                    {/* Resend Error Message */}
                    {resendError && <PanelError message={resendError} />}

                    <Input 
                      id="emailaddress"
                      label="Email address"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (resendError) setResendError("");
                      }}
                      placeholder="you@example.com"
                      disabled={isResending}
                    />
                    <Button
                      type="submit"
                      disabled={isResending}
                      className="w-full gap-2"
                    >
                      {isResending ? (
                        <>
                          <NaeLoader />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Password Link'
                      )}
                    </Button>
                  </form>
                </div>
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