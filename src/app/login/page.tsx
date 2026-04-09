"use client";

import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState, type SubmitEvent } from "react";

const LoginPage = () => {

  const { loading, login } = useAuth();

  const [isServerError, setIsServerError] = useState<boolean>(false);
  const [isInvalid, setIsInvalid] = useState<boolean>(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const buttonDisabled =
    loading ||
    credentials.email.trim().length === 0 ||
    credentials.password.trim().length === 0;

  const handleLogin = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault(); 

    if (loading) return;

    setIsInvalid(false);
    setIsServerError(false);

    try {
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
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form 
        className="flex w-75 flex-col items-center py-2 gap-8" 
        onSubmit={handleLogin}
      >
        <h1 className="text-3xl font-bold">Sign In</h1>
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
        <div className="flex flex-col gap-4 w-full">
          <Input 
            id="email" 
            label="Email"
            placeholder="email"
            type="email"
            required
            value={credentials.email}
            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
          />
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
        <Button
          type="submit"
          className="w-full"
          disabled={buttonDisabled}
        >
          {loading 
            ? (
              <>
                <Loader2 className="w-7 h-7 animate-spin text-blue-400" aria-hidden="true" />
                <span className="sr-only">Signing in</span>
              </>
            )
            : 'Sign In'}
        </Button>
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs">
            Don't have an account?{' '}
            <Link 
              href="/signup"
              className="text-brand hover:text-brand-highlight underline transition-colors"
            >
              Sign up here
            </Link>.
          </p>
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