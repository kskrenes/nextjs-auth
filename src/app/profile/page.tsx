"use client";

import { getErrorMessage } from "@/helpers/error-message";
import { triggerEmail } from "@/helpers/trigger-email";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type NaeUser from "@/models/user-interface"
import Button from "@/components/nae-button";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ProfilePage = () => {

  const [isLoading, setIsLoading] = useState(false);
  const [isSendingVerifyEmail, setIsSendingVerifyEmail] = useState(false);
  // const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [user, setUser] = useState<NaeUser | null>(null);

  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    (async () => {
      try {
        const res = await axios.get('/api/users/me');
        setUser(res.data.user as NaeUser);
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

  const handleVerifyEmailClick = async () => {
    if (!user) return;
    if (isSendingVerifyEmail) return;
    triggerEmail(user.email, "VERIFY", setIsSendingVerifyEmail);
  }

  const handleResetPasswordClick = () => {
    router.push("/triggerpasswordreset");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-[300px] flex-col items-center py-2" >
        <h1 className="mb-6 text-3xl font-bold">User Profile</h1>
        <div>
          <p>Username: {user?.username ?? 'None found'}</p>
          <p>
            Email: {user?.email ?? 'None found'}{' '}
            <span 
              title={user?.isVerified ? "Verified" : "Unverified"} 
              className="cursor-default"
            >
              {user?.isVerified ? "✅" : "⚠️"}
            </span>
          </p>
          <p>ID: {user?._id ?? 'None found'}</p>
          <p>Admin: {user?.isAdmin === undefined ? 'Not specified' : user.isAdmin ? "Yes" : "No"}</p>
          <p>Verified: {user?.isVerified === undefined ? 'Not specified' : user.isVerified ? "Yes" : "No"}</p>
        </div>
        {user && !user?.isVerified && (
          <Button 
            className="w-full mt-8"
            onClick={handleVerifyEmailClick}
            disabled={isSendingVerifyEmail}
          >
            Verify Email
          </Button>
        )}
        {user && (
          <Button 
            className="w-full my-8"
            onClick={handleResetPasswordClick}
            // disabled={isSendingResetEmail}
          >
            Reset Password
          </Button>
        )}
        <p className="text-xs">
          Return to{' '}
          <Link 
            href="/dashboard"
            className="text-purple-400 hover:text-purple-500 underline transition-colors"
          >
            dashboard page
          </Link>.
        </p>
      </div>
    </div>
  )
}

export default ProfilePage