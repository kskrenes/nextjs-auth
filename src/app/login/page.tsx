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
        className="flex w-[300px] flex-col items-center py-2" 
        onSubmit={handleLogin}
      >
        <h1 className="mb-6 text-3xl font-bold">Sign In</h1>
        {(isInvalid || isServerError) && (
          <div role="alert" className="flex items-center space-x-2 mb-4 text-sm text-red-500">
            <ShieldAlert className="w-4 h-4" />
            <span>
              {isInvalid 
                ? "Invalid email or password" 
                : "Server error. Please try again later."
              }
            </span>
          </div>
        )}
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
        <Button
          type="submit"
          className="w-full my-8"
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
        <p className="text-xs">
          Don't have an account?{' '}
          <Link 
            href="/signup"
            className="text-blue-400 hover:text-blue-500 underline transition-colors"
          >
            Sign up here
          </Link>.
        </p>
        <Link 
          href="/triggerpasswordreset"
          className="text-xs mt-2 text-blue-400 hover:text-blue-500 underline transition-colors"
        >
          Forgot password
        </Link>
      </form>
    </div>
  )
}

export default LoginPage