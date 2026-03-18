"use client";

import { getErrorMessage } from "@/helpers/error-message";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type User from "@/models/user-interface"
import Button from "@/components/nae-button";

const ProfilePage = () => {

  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setIsLoading(true);
    (async () => {
      try {
        const res = await axios.get('/api/users/me');
        setUser(res.data.user as User);
      }
      catch (error: unknown) {
        const errorMessage = getErrorMessage(error, "Get user data failed");
        console.error(errorMessage);
        toast.error(errorMessage);
      }
      finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader2 className='w-8 h-8 animate-spin text-purple-500' />
      </div>
    );
  }

  const handleVerifyEmailClick = () => {
    //
  }

  const handleResetPasswordClick = () => {
    // TODO: wire once reset password api exists
    console.log("reset password clicked");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-[300px] flex-col items-center py-2" >
        <h1 className="mb-6 text-3xl font-bold">User Profile</h1>
        <div>
          <p>Username: {user?.username ?? 'None found'}</p>
          <p>Email: {user?.email ?? 'None found'}</p>
          <p>ID: {user?._id ?? 'None found'}</p>
          <p>Admin: {user?.isAdmin === undefined ? 'Not specified' : user.isAdmin ? "Yes" : "No"}</p>
          <p>Verified: {user?.isVerified === undefined ? 'Not specified' : user.isVerified ? "Yes" : "No"}</p>
        </div>
        {!user?.isVerified && (
          <Button 
            className="w-full mt-8"
            onClick={handleVerifyEmailClick}
          >
            Verify Email
          </Button>
        )}
        <Button 
          className="w-full mt-8"
          onClick={handleResetPasswordClick}
        >
          Reset Password
        </Button>
      </div>
    </div>
  )
}

export default ProfilePage