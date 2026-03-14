"use client";

import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import axios from "axios";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type SubmitEvent } from "react";
import toast from "react-hot-toast";

const SignupPage = () => {

  const router = useRouter();

  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState({
    email: "",
    password: "",
    username: "",
  });

  useEffect(() => {
    if (
      user.email.length > 0 && 
      user.password.length > 0 && 
      user.username.length > 0 &&
      !isLoading
    ) {
      setButtonDisabled(false);
    } else {
      setButtonDisabled(true);
    }
  }, [user, isLoading]);

  const onSignup = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault(); 

    try {
      setIsLoading(true);
      const response = await axios.post("/api/users/signup", user);
      router.push("/login");
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || "Signup failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };  

  return (
    <div className="flex justify-center min-h-screen">
      <form 
        className="flex flex-col items-center justify-center w-[300px] py-2" 
        onSubmit={onSignup} 
      >
        <h1 className="mb-6 text-3xl font-bold">Sign Up</h1>
        <Input 
          id="username" 
          label="Username"
          placeholder="username"
          type="text"
          required
          value={user.username}
          onChange={(e) => setUser({...user, username: e.target.value})}
        />
        <Input 
          id="email" 
          label="Email"
          placeholder="email@example.com"
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
          autoComplete="new-password"
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