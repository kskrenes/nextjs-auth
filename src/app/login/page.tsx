"use client";

import GoogleLoginButton from "@/components/google-login-button";
import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import NaeLoader from "@/components/nae-loader";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type SubmitEvent } from "react";

const LoginPage = () => {

  const { user, login, fetchingUser, loggingIn } = useAuth();
  const router = useRouter();

  const [awaitingRedirect, setAwaitingRedirect] = useState<boolean>(false);
  const [isServerError, setIsServerError] = useState<boolean>(false);
  const [isInvalid, setIsInvalid] = useState<boolean>(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (fetchingUser || loggingIn) return;
    if (user) {
      router.replace(user.hasCompletedProfile ? '/dashboard' : '/onboarding');
    }
  }, [user, fetchingUser, loggingIn, router]);

  const buttonDisabled =
    loggingIn || awaitingRedirect ||
    credentials.email.trim().length === 0 ||
    credentials.password.trim().length === 0;

  const handleLogin = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault(); 

    if (loggingIn || awaitingRedirect) return;

    setIsInvalid(false);
    setIsServerError(false);

    try {
      setAwaitingRedirect(true);
      await login(credentials.email, credentials.password);  
    } catch (error) {
      if (
        axios.isAxiosError(error) && 
        error.response?.status === 401
      ) {
        setIsInvalid(true);
      } else {
        setIsServerError(true);
      }
      setAwaitingRedirect(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      {/* sign in form */}
      <form 
        className="flex w-75 flex-col items-center py-2 gap-8" 
        onSubmit={handleLogin}
      >
        {/* title */}
        <h1 className="text-3xl font-bold">Sign In</h1>

        {/* error message */}
        {(isInvalid || isServerError) && (
          <div role="alert" className="flex items-center space-x-2 text-sm text-red-500">
            <ShieldAlert className="w-4 h-4" />
            <span>
              {isInvalid 
                ? "Invalid email or password" 
                : "Server error. Please try again later."
              }
            </span>
          </div>
        )}

        {/* input group */}
        <div className="flex flex-col gap-4 w-full">
          {/* email */}
          <Input 
            id="email" 
            label="Email"
            placeholder="email"
            type="email"
            required
            value={credentials.email}
            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
          />
          {/* password */}
          <Input 
            id="password" 
            label="Password"
            placeholder="password"
            type="password"
            autoComplete="current-password"
            required
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
          />
        </div>

        {/* submit button */}
        <Button
          type="submit"
          className="w-full"
          disabled={buttonDisabled}
        >
          {loggingIn || awaitingRedirect
            ? (
              <>
                <NaeLoader />
                <span className="sr-only">Signing in</span>
              </>
            )
            : 'Sign In'}
        </Button>

        {/* google sso button */}
        <GoogleLoginButton 
          onLoginAttempt={() => setAwaitingRedirect(true)} 
          onLoginError={() => setAwaitingRedirect(false)}
          disabled={loggingIn || awaitingRedirect} 
        />

        {/* links group */}
        <div className="flex flex-col items-center gap-2">
          {/* sign up link */}
          <p className="text-xs">
            Don&apos;t have an account?{' '}
            <Link 
              href="/signup"
              className="text-brand hover:text-brand-highlight underline transition-colors"
            >
              Sign up here
            </Link>.
          </p>
          {/* reset password link */}
          <Link 
            href="/triggerpasswordreset"
            className="text-xs text-brand hover:text-brand-highlight underline transition-colors"
          >
            Forgot password
          </Link>
        </div>
      </form>
    </div>
  )
}

export default LoginPage