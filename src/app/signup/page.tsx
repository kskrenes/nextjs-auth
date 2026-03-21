"use client";

import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import SetPasswordInputs from "@/components/nae-set-password";
import { getErrorMessage } from "@/helpers/error-message";
import { excludesSpaces } from "@/helpers/expression-validation";
import axios from "axios";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import toast from "react-hot-toast";

const SignupPage = () => {

  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [user, setUser] = useState({
    email: "",
    password: "",
    username: "",
  });

  // allow button to enable as long as all fields have input.
  // this gives more feedback to the user, since each field
  // will enforce its own minimum requirements, and password matching
  // will show a dedicated error instead of silently dissallowing submit.
  const buttonDisabled =
    isLoading ||
    user.username.trim().length === 0 ||
    user.email.trim().length === 0 ||
    user.password.length === 0 ||
    confirmPassword.length === 0;

  const handleSignup = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault(); 

    if (isLoading) return;

    setIsError(false);
    setErrorMessage("");

    const normalizedUsername = user.username.trim();

    // validate username
    if (!excludesSpaces(normalizedUsername)) {
      setErrorMessage("Username cannot contain spaces");
      setIsError(true);
      return;
    }

    if (normalizedUsername.length < 4) {
      setErrorMessage("Username must meet minimum character requirement");
      setIsError(true);
      return;
    }

    // verify password match
    if (user.password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      setIsError(true);
      return;
    }

    // validate password
    if (!excludesSpaces(user.password)) {
      setErrorMessage("Password cannot contain spaces");
      setIsError(true);
      return;
    }
    
    try {
      setIsLoading(true);
      await axios.post("/api/users/signup", user);
      toast.success("Your account has been created!")
      router.push("/login");
    } 
    catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, "An error occurred. Please try again."));
      setIsError(true);
    } 
    finally {
      setIsLoading(false);
    }
  };

  // clear inline errors when fields change
  const clearInlineError = () => {
    if (isError) {
      setIsError(false);
      setErrorMessage("");
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
    <div className="flex min-h-screen items-center justify-center">
      <form 
        className="flex w-[300px] flex-col items-center py-2" 
        onSubmit={handleSignup} 
      >
        <h1 className="mb-6 text-3xl font-bold">Sign Up</h1>
        {isError && (
          <div role="alert" className="flex items-center space-x-2 mb-4 text-sm text-red-500">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-center">{errorMessage}</span>
          </div>
        )}
        <Input 
          id="username" 
          label="Username"
          placeholder="username"
          type="text"
          instruction="4 character minimum, no spaces"
          minLength={4}
          required
          value={user.username}
          onChange={(e) => handleUsernameChange(e.target.value)}
        />
        <Input 
          id="email" 
          label="Email"
          placeholder="email@example.com"
          type="email"
          required
          value={user.email}
          onChange={(e) => handleEmailChange(e.target.value)}
        />
        <SetPasswordInputs 
          label="Password"
          password={user.password}
          confirmPassword={confirmPassword}
          onPasswordChange={handlePasswordChange}
          onConfirmPasswordChange={handleConfirmPasswordChange}
        />
        <Button
          type="submit"
          className="w-full my-8"
          disabled={buttonDisabled}
        >
          {isLoading 
            ? (
              <>
                <Loader2 className="w-7 h-7 animate-spin text-purple-400" aria-hidden="true" />
                <span className="sr-only">Creating account</span>
              </>
            )
            : 'Sign Up'}
        </Button>
        <p className="text-xs">
          Already have an account?{' '}
          <Link 
            href="/login"
            className="text-purple-400 hover:text-purple-500 underline transition-colors"
          >
            Sign in here
          </Link>.
        </p>
      </form>
    </div>
  )
}

export default SignupPage