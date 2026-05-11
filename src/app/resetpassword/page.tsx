"use client";

import Button from "@/components/nae-button";
import NaeLoader from "@/components/nae-loader";
import SetPasswordInputs from "@/components/nae-set-password";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/helpers/error-message";
import { getValidPassword } from "@/helpers/expression-validation";
import axios from "axios";
import { LaptopMinimalCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type SubmitEvent } from "react";
import toast from "react-hot-toast";

const ResetPasswordPage = () => {

  const [token, setToken] = useState<string>("");
  const [isReset, setIsReset] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isValidationError, setIsValidationError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isPendingReset, setIsPendingReset] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const router = useRouter();

  const { logout } = useAuth();

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get("token") ?? "";
    if (!urlToken) {
      setErrorMessage("Please follow the link from your email")
      setIsError(true);
      return;
    }
    setToken(urlToken);
  }, [])

  const handleReset = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault();

    setIsError(false);
    setIsValidationError(false);
    setErrorMessage("");

    if (!token) {
      setErrorMessage("Please follow the link from your email");
      setIsError(true);
      return;
    }

    if (isPendingReset) return;

    let validPassword;
    try {
      validPassword = getValidPassword(newPassword, confirmPassword);
    } catch (error: unknown) {
      setErrorMessage((error as Error).message);
      setIsValidationError(true);
      return;
    }

    try {
      setIsPendingReset(true);
      const response = await axios.post(
        "/api/users/resetpassword", 
        { token, password: validPassword }
      );
      setIsReset(true);
      if (response.data.warning) {
        toast(response.data.warning, {
          icon: '⚠️',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      } else {
        setTimeout(logout, 3000);
      }
    } 
    catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      setErrorMessage(getErrorMessage(error, "Unable to reset password"));
      if (status === 401 || status === 410) {
        // fatal errors are unretriable
        setIsError(true);
      } else {
        // all other errors display inline and allow retry
        setIsValidationError(true);
      }
    } 
    finally {
      setIsPendingReset(false);
    }
  }

  const handleResendClick = () => {
    router.push("/triggerpasswordreset");
  }

  // clear stale inline errors when either password changes
  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    if (isValidationError) {
      setIsValidationError(false);
      setErrorMessage("");
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (isValidationError) {
      setIsValidationError(false);
      setErrorMessage("");
    }
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      {isReset ? (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-8">
          <LaptopMinimalCheck className="w-10 h-10 text-blue-600" />
          <h1 className="mb-6 text-3xl font-bold">Your password has been reset.</h1>
          <p className="text-xs">
            {'Go to '}
            <Link 
              href="/login"
              className="text-blue-400 hover:text-blue-500 underline transition-colors"
            >
              Sign in
            </Link>{' page.'}
          </p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-8">
          <ShieldAlert className="w-10 h-10 text-red-600" />
          <h1 className="mb-6 text-3xl font-bold">{errorMessage}</h1>
          <Button
            className="mt-4"
            onClick={handleResendClick}
          >
            Resend Email
          </Button>
          <p className="text-xs">
            {'Go to '}
            <Link 
              href="/login"
              className="text-blue-400 hover:text-blue-500 underline transition-colors"
            >
              Sign in
            </Link>{' page.'}
          </p>
        </div>
      ) : (
        <form 
          className="flex w-75 flex-col items-center py-2" 
          onSubmit={handleReset} 
        >
          <h1 className="mb-6 text-3xl font-bold">Reset Password</h1>
          {isValidationError && (
            <div role="alert" className="flex items-center space-x-2 mb-4 text-sm text-red-500">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-center">{errorMessage}</span>
            </div>
          )}
          <SetPasswordInputs 
            label="New Password"
            password={newPassword}
            confirmPassword={confirmPassword}
            onPasswordChange={handlePasswordChange}
            onConfirmPasswordChange={handleConfirmPasswordChange}
          />
          <Button
            type="submit"
            className="w-full mt-8"
            disabled={
              isPendingReset ||
              !token ||
              newPassword.length === 0 || 
              confirmPassword.length === 0
            }
          >
            {isPendingReset 
              ? (
                <>
                  <NaeLoader />
                  <span className="sr-only">Resetting password</span>
                </>
              )
              : 'Submit'}
          </Button>
        </form>
      )}
    </div>
  )
}

export default ResetPasswordPage