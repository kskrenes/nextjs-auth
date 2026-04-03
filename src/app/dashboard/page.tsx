"use client";

import Button from "@/components/nae-button"
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const DashboardPage = () => {

  const { loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (loading) return;
    logout();
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
          onClick={() => router.push("/profile")}
        >
          User Profile
        </Button>
        
        <Button 
          className="w-full my-8"
          onClick={handleLogout}
          disabled={loading}
        >
          {loading 
            ? (
              <>
                <Loader2 className="w-7 h-7 animate-spin text-purple-400" aria-hidden="true" />
                <span className="sr-only">Signing out</span>
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