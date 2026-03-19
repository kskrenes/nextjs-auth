"use client";

import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import { getErrorMessage } from "@/helpers/error-message";
import axios from "axios";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import toast from "react-hot-toast";

const LoginPage = () => {

  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState({
    email: "",
    password: "",
  });

  const buttonDisabled =
    isLoading ||
    user.email.trim().length === 0 ||
    user.password.trim().length === 0;

  const handleLogin = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault(); 

    if (isLoading) return;

    try {
      setIsLoading(true);
      await axios.post("/api/users/login", user);
      router.push("/dashboard");
    } 
    catch (error: unknown) {
      toast.error(getErrorMessage(error, "Login failed"));
    } 
    finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form 
        className="flex w-[300px] flex-col items-center py-2" 
        onSubmit={handleLogin}
      >
        <h1 className="mb-6 text-3xl font-bold">Sign In</h1>
        <Input 
          id="email" 
          label="Email"
          placeholder="email"
          type="email"
          required
          value={user.email}
          onChange={(e) => setUser({...user, email: e.target.value})}
        />
        <Input 
          id="password" 
          label="Password"
          placeholder="password"
          type="password"
          autoComplete="current-password"
          required
          value={user.password}
          onChange={(e) => setUser({...user, password: e.target.value})}
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
                <span className="sr-only">Signing in</span>
              </>
            )
            : 'Sign In'}
        </Button>
        <p className="text-xs">
          Don't have an account?{' '}
          <Link 
            href="/signup"
            className="text-purple-400 hover:text-purple-500 underline transition-colors"
          >
            Sign up here
          </Link>.
        </p>
        <Link 
          href="/triggerpasswordreset"
          className="text-xs mt-2 text-purple-400 hover:text-purple-500 underline transition-colors"
        >
          Forgot password
        </Link>
      </form>
    </div>
  )
}

export default LoginPage