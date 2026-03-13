"use client";

import Link from "next/link";
import { useState } from "react";

const SignupPage = () => {

  const [user, setUser] = useState({
    email: "",
    password: "",
    username: "",
  });

  const onSignup = async () => {
    //
  };

  return (
    <div className="flex justify-center min-h-screen">
      <div className="flex flex-col items-center justify-center w-[300px] py-2">
        <h1 className="mb-6 text-3xl font-bold">Sign Up</h1>
        <div className="flex flex-col space-y-2 min-w-[300px]">
          <label className="text-sm" htmlFor="username">Username</label>
          <input 
            id="username"
            type="text"
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
            type="email"
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
            type="password"
            value={user.password}
            className="p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-purple-400"
            onChange={(e) => setUser({...user, password: e.target.value})}
            placeholder="password"
          />
        </div>
        <button 
          className="w-full my-8 py-2 text-lg rounded-xl font-semibold bg-purple-900 hover:bg-purple-800 transition-colors cursor-pointer"
          onClick={onSignup}
        >
          Sign Up
        </button>
        <p className="text-xs">
          Already have an account?{' '}
          <Link 
            href="/login"
            className="text-purple-400 hover:text-purple-500 underline transition-colors"
          >
            Log in here
          </Link>.
        </p>
        
      </div>
    </div>
  )
}

export default SignupPage