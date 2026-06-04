"use client";

import Button from "@/components/nae-button";
import NaeLoader from "@/components/nae-loader";
import SetPasswordInputs from "@/components/nae-set-password";
import PanelError from "@/components/panel-error";
import PanelHeader from "@/components/panel-header";
import PanelSuccess from "@/components/panel-success";
import { useAuth } from "@/context-providers/auth-context-provider";
import { getErrorMessage } from "@/helpers/util/error-utils";
import { getValidPassword } from "@/helpers/util/form-validation-utils";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState, type SubmitEvent } from "react";
import toast from "react-hot-toast";

const ResetPasswordPage = () => {

  const [token, setToken] = useState<string>("");
  const [pending, setPending] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const { logout } = useAuth();

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get("token") ?? "";
    if (!urlToken) {
      setError("Please follow the link from your email")
      return;
    }
    setToken(urlToken);
  }, [])

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault();

    if (pending) return;

    setError('');
    setSuccess(false);

    if (!token) {
      setError("Please follow the link from your email");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm a new password");
      return;
    }

    let validPassword;
    try {
      validPassword = getValidPassword(newPassword, confirmPassword);
    } catch (error: unknown) {
      setError((error as Error).message);
      return;
    }

    try {
      setPending(true);
      const response = await axios.post(
        "/api/users/resetpassword", 
        { token, password: validPassword }
      );
      setSuccess(true);
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
      setError(getErrorMessage(error, "Unable to reset password"));
    } 
    finally {
      setPending(false);
    }
  }
  
  return (
    <div className="page-centered">
      <div className="max-w-md w-full">
        <div className="bg-panel rounded-lg p-8">

          {/* Header */}
          <PanelHeader 
            title="Reset Password" 
            description="Submit a new password"
          />

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && <PanelError message={error} />}
            {/* Success Message */}
            {success && <PanelSuccess message="Your password has been reset" />}

            {/* Password Fields */}
            <SetPasswordInputs 
              label="New Password"
              password={newPassword}
              confirmPassword={confirmPassword}
              onPasswordChange={(val) => {
                setNewPassword(val);
                if (error) setError('');
              }}
              onConfirmPasswordChange={(val) => {
                setConfirmPassword(val);
                if (error) setError('');
              }}
              disabled={pending || !token}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={pending || !token}
              className="w-full gap-2"
            >
              {pending ? (
                <>
                  <NaeLoader />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
            {/* Login Link */}
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
              <p className="text-sm text-foreground-secondary">
                <Link 
                  href="/triggerpasswordreset"
                  className="input-link"
                  >
                  Request
                </Link>
                {' '}a new email link
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage