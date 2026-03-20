"use client";

import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import SetPasswordInputs from "@/components/nae-set-password";
import axios from "axios";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";

const SignupPage = () => {

  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [user, setUser] = useState({
    email: "",
    password: "",
    username: "",
  });

  const buttonDisabled =
    isLoading ||
    user.username.trim().length === 0 ||
    user.email.trim().length === 0 ||
    user.password.trim().length < 8 ||
    confirmPassword.trim() !== user.password.trim();

  const handleSignup = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault(); 

    if (isLoading) return;

    setIsError(false);

    try {
      setIsLoading(true);
      await axios.post("/api/users/signup", user);
      router.push("/login");
    } 
    catch (error: unknown) {
      setIsError(true);
    } 
    finally {
      setIsLoading(false);
    }
  };

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
            <span>
              An error occurred. Please try again.
            </span>
          </div>
        )}
        <Input 
          id="username" 
          label="Username"
          placeholder="username"
          type="text"
          instruction="4 character minimum"
          required
          value={user.username}
          onChange={(e) => setUser({...user, username: e.target.value})}
        />
          {/* <span className="absolute right-0 top-1 text-xs">4 character minimum</span> */}
        {/* </Input> */}
        <Input 
          id="email" 
          label="Email"
          placeholder="email@example.com"
          type="email"
          required
          value={user.email}
          onChange={(e) => setUser({...user, email: e.target.value})}
        />
        <SetPasswordInputs 
          label="Password"
          password={user.password}
          confirmPassword={confirmPassword}
          onPasswordChange={(v:string) => setUser({...user, password: v})}
          onConfirmPasswordChange={setConfirmPassword}
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