"use client";

import Button from "@/components/nae-button";
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
        <div className="flex flex-col space-y-2 min-w-[300px]">
          <label className="text-sm" htmlFor="username">Username</label>
          <input 
            id="username"
            name="username"
            type="text"
            required
            autoComplete="username"
            value={user.username}
            className="p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-purple-400"
            onChange={(e) => setUser({...user, username: e.target.value})}
            placeholder="username"
          />
        </div>
        <div className="flex flex-col space-y-2 min-w-[300px]">
          <label className="text-sm" htmlFor="email">Email</label>
          <input 
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={user.email}
            className="p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-purple-400"
            onChange={(e) => setUser({...user, email: e.target.value})}
            placeholder="email@example.com"
          />
        </div>
        <div className="flex flex-col space-y-2 min-w-[300px]">
          <label className="text-sm" htmlFor="password">Password</label>
          <input 
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            value={user.password}
            className="p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-purple-400"
            onChange={(e) => setUser({...user, password: e.target.value})}
            placeholder="password"
          />
        </div>
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