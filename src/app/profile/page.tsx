"use client";

import Button from "@/components/nae-button"
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

const ProfilePage = () => {

  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await axios.post("/api/users/logout");
      router.push("/login");
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || "Logout failed";
      toast.error(message);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-[300px] flex-col items-center py-2" >
        <h1 className="mb-6 text-3xl font-bold">Profile Page</h1>
        <p>Some kind of general profile stuff</p>
        <Button 
          className="w-full my-8"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut 
            ? (
              <>
                <Loader2 className="w-7 h-7 animate-spin text-purple-400" aria-hidden="true" />
                <span className="sr-only">Signing out</span>
              </>
            )
            : 'Sign Out'}
        </Button>
      </div>
    </div>
  )
}

export default ProfilePage