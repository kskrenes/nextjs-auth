"use client";

import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import NaeLoader from "@/components/nae-loader";
import SetPasswordInputs from "@/components/nae-set-password";
import PanelError from "@/components/panel-error";
import PanelHeader from "@/components/panel-header";
import { getErrorMessage } from "@/helpers/util/error-utils";
import { getValidEmail, getValidPassword, getValidUsername } from "@/helpers/util/form-validation-utils";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import toast from "react-hot-toast";

const SignupPage = () => {

  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [user, setUser] = useState({
    email: "",
    password: "",
    username: "",
  });

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault(); 

    if (isLoading) return;

    setError('');

    let validEmail;
    let validUsername;
    let validPassword;
    try {
      validEmail = getValidEmail(user.email);
      validUsername = getValidUsername(user.username);
      validPassword = getValidPassword(user.password, confirmPassword);
    } catch (error: unknown) {
      setError((error as Error).message);
      return;
    }
    
    try {
      setIsLoading(true);
      await axios.post("/api/users/signup", {
        email: validEmail,
        username: validUsername,
        password: validPassword,
      });
      toast.success("Your account has been created!")
      router.push("/login");
    } 
    catch (error: unknown) {
      setError(getErrorMessage(error, "An error occurred. Please try again."));
    } 
    finally {
      setIsLoading(false);
    }
  };

  // clear inline errors when fields change
  const clearInlineError = () => {
    if (error) {
      setError('');
    }
  }

  const handleUsernameChange = (value: string) => {
    clearInlineError();
    setUser((current) => ({ ...current, username: value }));
  }

  const handleEmailChange = (value: string) => {
    clearInlineError();
    setUser((current) => ({ ...current, email: value }));
  }

  const handlePasswordChange = (value: string) => {
    clearInlineError();
    setUser((current) => ({ ...current, password: value }));
  }

  const handleConfirmPasswordChange = (value: string) => {
    clearInlineError();
    setConfirmPassword(value);
  }

  return (
    <div className="page-centered">
      <div className="max-w-md w-full">
        <div className="panel p-8">

          {/* Header */}
          <PanelHeader 
            title="Create your account" 
            description="Sign up to get started with your new account"
          />

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && <PanelError message={error} />}

            {/* Username Field */}
            <Input 
              id="username" 
              label="Username"
              type="text"
              placeholder="Enter a username"
              value={user.username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              disabled={isLoading}
              minLength={4}
              required
            />

            {/* Email Field */}
            <Input 
              id="email" 
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={user.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              disabled={isLoading}
              required
            />

            {/* Password Field */}
            <SetPasswordInputs 
              label="Password"
              password={user.password}
              confirmPassword={confirmPassword}
              onPasswordChange={handlePasswordChange}
              onConfirmPasswordChange={handleConfirmPasswordChange}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading 
                ? (
                 <>
                  <NaeLoader />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-foreground-secondary">
              Already have an account?{' '}
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

export default SignupPage