"use client";

import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import { getErrorMessage } from "@/helpers/error-message";
import { triggerEmail } from "@/helpers/trigger-email";
import type NaeUser from "@/models/user-interface";
import axios from "axios";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const TriggerPasswordResetPage = () => {

  const [user, setUser] = useState<NaeUser | null>(null);
  const [fetchingUser, setFetchingUser] = useState<boolean>(false);
  const [pendingReset, setPendingReset] = useState<boolean>(false);
  // const [emailSent, setEmailSent] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (fetchingUser) return;

    (async () => {
      try {
        setFetchingUser(true);
        const res = await axios.get('/api/users/me');
        const user = res.data.user as NaeUser
        setUser(user);
        setEmail(user.email);
      } catch (error: unknown) {
        const message = getErrorMessage(error, "Failed to fetch user");
        console.log(message);
      } finally {
        setFetchingUser(false);
      }
    })();
  }, [])

  if (fetchingUser) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader2 className='w-8 h-8 animate-spin text-purple-500' />
      </div>
    );
  }
  
  const handleReset = (e: any) => {
    // suppress native html form submit behavior
    e.preventDefault();

    if (pendingReset || email.length === 0) return;
    triggerEmail(email, "RESET", setPendingReset);
  }


  return (
    <div className="flex min-h-screen items-center justify-center">
      <form 
        className="flex w-[300px] flex-col items-center py-2" 
        onSubmit={handleReset} 
      >
        <h1 className="mb-6 text-3xl font-bold">Reset Password</h1>
        {/* {user ? (
          <>
            <Input 
              id="oldpassword" 
              label="Old Password"
              // placeholder="Old Password"
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <Input 
              id="newpassword" 
              label="New Password"
              // placeholder="email@example.com"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input 
              id="confirmpassword" 
              label="Confirm New Password"
              // placeholder="password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </>
        ) : (
          <> */}
            <Input 
              id="email" 
              label="Email"
              placeholder="email@example.com"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="mt-4 mb-8">
              {/* {emailSent 
                ? (
                  <p className="mt-2 mb-3">Email sent.</p>
                ) 
                : ( */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={fetchingUser || email.length === 0}
                  >
                    {pendingReset 
                      ? (
                        <>
                          <Loader2 className="w-7 h-7 animate-spin text-purple-400" aria-hidden="true" />
                          <span className="sr-only">Resetting password</span>
                        </>
                      )
                      : 'Send Reset Email'}
                  </Button>
                {/* )
              } */}
            </div>
            {user ? (
              <Link 
                href="/profile"
                className="text-xs text-purple-400 hover:text-purple-500 underline transition-colors"
              >
                Back to profile
              </Link>
            ) : (
              <p className="text-xs">
                Already have a password?{' '}
                <Link 
                  href="/login"
                  className="text-purple-400 hover:text-purple-500 underline transition-colors"
                >
                  Sign in here
                </Link>.
              </p>
            )}
            
          {/* </>
        )} */}
        
        
      </form>
    </div>
  )
}

export default TriggerPasswordResetPage