"use client";

import GoogleLoginButton from "@/components/google-login-button";
import MFAChallenge from "@/components/mfa-challenge";
import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import NaeLoader from "@/components/nae-loader";
import PanelError from "@/components/panel-error";
import PanelHeader from "@/components/panel-header";
import { AuthLoginResponse, useAuth } from "@/context-providers/auth-context-provider";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type SubmitEvent } from "react";

const LoginPage = () => {

  const { user, login, fetchingUser, loggingIn } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mfaPending, setMfaPending] = useState(false);
  const [awaitingRedirect, setAwaitingRedirect] = useState(false);

  useEffect(() => {
    if (fetchingUser || loggingIn) return;
    if (user) {
      router.replace(user.hasCompletedProfile ? '/dashboard' : '/onboarding');
    }
  }, [user, fetchingUser, loggingIn, router]);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault(); 

    if (loggingIn || awaitingRedirect) return;

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setError('');
      setAwaitingRedirect(true);
      const res = await login(email, password);
      if (res.data.mfaRequired) {
        setAwaitingRedirect(false);
        setMfaPending(true);
      }
    } catch (error) {
      const invalid = axios.isAxiosError(error) && error.response?.status === 401;
      setError(invalid ? 'Invalid email or password' : 'Server error. Please try again later.');
      setAwaitingRedirect(false);
    }
  };

  const handleGoogleLoginAttempt = useCallback(() => {
    setAwaitingRedirect(true);
  }, []);

  const handleGoogleLoginError = useCallback(() => {
    setAwaitingRedirect(false);
  }, []);

  const handleGoogleCallback = useCallback((res: AuthLoginResponse) => {
    if (res.data.mfaRequired) {
      setAwaitingRedirect(false);
      setMfaPending(true);
    }
  }, []);

  const handleMfaChallengeCancel = () => {
    setAwaitingRedirect(false);
    setMfaPending(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-panel rounded-lg p-8">

          {mfaPending ? (
            // Multi-Factor Authentication Challenge
            <MFAChallenge onCancel={handleMfaChallengeCancel} />
          ) : (
            <>
              {/* Header */}
              <PanelHeader 
                title="Welcome back" 
                description="Sign in to your account to continue"
              />

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Message */}
                {error && <PanelError message={error} />}

                {/* Email Field */}
                <Input 
                  id="email" 
                  type="email"
                  label="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="you@example.com"
                  disabled={awaitingRedirect}
                />

                {/* Password Field */}
                <Input
                  id="password" 
                  type="password"
                  label="Password"
                  value={password}
                  link={{
                    label: 'Forgot password?',
                    href: '/triggerpasswordreset'
                  }}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your password"
                  disabled={awaitingRedirect}
                  autoComplete="current-password"
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={awaitingRedirect}
                  className="w-full gap-2"
                >
                  {awaitingRedirect ? (
                    <>
                      <NaeLoader />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-panel-highlight" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-panel text-foreground-muted">Or continue with</span>
                </div>
              </div>

              {/* Google Sign In */}
              <GoogleLoginButton 
                onLoginAttempt={handleGoogleLoginAttempt} 
                onLoginError={handleGoogleLoginError}
                callback={handleGoogleCallback}
                disabled={awaitingRedirect} 
              />

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-foreground-secondary">
                  Don&apos;t have an account?{' '}
                  <Link 
                    href="/signup"
                    className="text-brand hover:text-brand-highlight font-medium transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </>
          )}  
        </div>
      </div>
    </div>
  )
}

export default LoginPage