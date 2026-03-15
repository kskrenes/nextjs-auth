"use client";

import Button from "@/components/nae-button"
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const ProfilePage = () => {

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.get("/api/users/logout");
      router.push("/login");
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || "Logout failed";
      toast.error(message);
    }
  }

  return (
    <div className="flex justify-center min-h-screen">
      <div className="flex flex-col items-center justify-center w-[300px] py-2" >
        <h1 className="mb-6 text-3xl font-bold">Profile Page</h1>
        <Button 
          className="px-8 my-8"
          onClick={handleLogout}
        >
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export default ProfilePage