"use client";

import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import Link from "next/link";
import { useState, type SubmitEvent } from "react";

const SignupPage = () => {

  const [user, setUser] = useState({
    email: "",
    password: "",
    username: "",
  });

  const onSignup = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Replace with real signup request.
    // Avoid silent no-op UX until backend wiring is ready.
    return;
  };

  return (
    <div className="flex justify-center min-h-screen">
      <form className="flex flex-col items-center justify-center w-[300px] py-2" onSubmit={onSignup}>
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
          disabled={!user.username || !user.email || !user.password}
        >
          Sign Up
        </Button>
        <p className="text-xs">
          Already have an account?{' '}
          <Link 
            href="/login"
            className="text-purple-400 hover:text-purple-500 underline transition-colors"
          >
            Log in here
          </Link>.
        </p>
      </form>
    </div>
  )
}

export default SignupPage