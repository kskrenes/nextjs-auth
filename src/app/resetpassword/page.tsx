"use client";

import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import { getErrorMessage } from "@/helpers/error-message";
import axios from "axios";
import { LaptopMinimalCheck, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type SubmitEvent } from "react";
import toast from "react-hot-toast";

const ResetPasswordPage = () => {

  const [token, setToken] = useState<string>("");
  const [isReset, setIsReset] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isPendingReset, setIsPendingReset] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get("token") ?? "";
    if (!urlToken) {
      setIsError(true);
      return;
    }
    setToken(urlToken);
  }, [])

  const handleReset = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault(); 

    if (isPendingReset) return;

    try {
      setIsPendingReset(true);
      await axios.post("/api/users/resetpassword", { token, password: newPassword });
      setIsReset(true);
    } 
    catch (error: unknown) {
      const message = getErrorMessage(error, "Password reset failed");
      console.error(message);
      toast.error(message);
      setIsError(true);
    } 
    finally {
      setIsPendingReset(false);
    }
  }

  const handleResendClick = () => {
    router.push("/triggerpasswordreset");
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      {isReset ? (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-8">
          <LaptopMinimalCheck className="w-10 h-10 text-purple-600" />
          <h1 className="mb-6 text-3xl font-bold">Your password has been reset.</h1>
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
      ) : isError ? (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-8">
          <ShieldAlert className="w-10 h-10 text-red-600" />
          <h1 className="mb-6 text-3xl font-bold">Unable to reset password</h1>
          <Button
            onClick={handleResendClick}
          >
            Resend Email
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
            id="newpassword" 
            label="New Password"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input 
            id="confirmpassword" 
            label="Confirm New Password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            type="submit"
            className="w-full mt-8"
            disabled={newPassword.length === 0 || newPassword !== confirmPassword}
          >
            {isPendingReset 
              ? (
                <>
                  <Loader2 className="w-7 h-7 animate-spin text-purple-400" aria-hidden="true" />
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