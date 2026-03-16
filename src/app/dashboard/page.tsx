"use client";

import Button from "@/components/nae-button"
import { getErrorMessage } from "@/helpers/error-message";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

const DashboardPage = () => {

  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);

  const getUserDetails = async () => {
    if (isFetchingProfile) return;

    try {
      setIsFetchingProfile(true);
      const response = await axios.get('/api/users/me');
      router.push(`/profile/${response.data.user._id}`);
    } 
    catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Get user data failed");
      console.error(errorMessage);
      toast.error(errorMessage);
    } 
    finally {
      setIsFetchingProfile(false);
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await axios.post("/api/users/logout");
      router.push("/login");
    } 
    catch (error: unknown) {
      toast.error(getErrorMessage(error, "Logout failed"));
    } 
    finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-[300px] flex-col items-center py-2" >
        <h1 className="mb-6 text-3xl font-bold">Dashboard Page</h1>
        <div>
          <p>Various data that's displayed on the dashboard page...</p>
        </div>
        
        <Button 
          className="w-full mt-8"
          onClick={getUserDetails}
          disabled={isFetchingProfile || isLoggingOut}
        >
          User Profile
        </Button>
        <Button 
          className="w-full my-8"
          onClick={handleLogout}
          disabled={isFetchingProfile || isLoggingOut}
        >
          {isFetchingProfile || isLoggingOut 
            ? (
              <>
                <Loader2 className="w-7 h-7 animate-spin text-purple-400" aria-hidden="true" />
                <span className="sr-only">{isLoggingOut ? "Signing out" : "Fetching profile"}</span>
              </>
            ) 
            : "Sign Out"
          }
        </Button>
      </div>
    </div>
  )
}

export default DashboardPage