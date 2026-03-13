"use client";

import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import Link from "next/link";
import { useState, type SubmitEvent } from "react";

const LoginPage = () => {

  const [user, setUser] = useState({
    email: "",
    password: "",
  });

  const onLogin = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Replace with real login request.
    // Avoid silent no-op UX until backend wiring is ready.
    return;
  };

  return (
    <div className="flex justify-center min-h-screen">
      <form className="flex flex-col items-center justify-center w-[300px] py-2" onSubmit={onLogin}>
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
          disabled={!user.email || !user.password}
        >
          Sign In
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
      </form>
    </div>
  )
}

export default LoginPage