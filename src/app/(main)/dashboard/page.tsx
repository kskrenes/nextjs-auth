"use client";

import FullScreenLoader from "@/components/full-screen-loader";
import { useAuth } from "@/context/AuthContext";

const DashboardPage = () => {

  const { fetchingUser } = useAuth();

  if (fetchingUser) return <FullScreenLoader />;

  return (
    <div className="pt-14 md:pt-24 mx-5 xs:mx-8 mb-8">

      {/* page title */}
      <h1 className="text-2xl min-w-39 max-w-90 font-semibold mx-auto md:mx-0 mb-8">My Dashboard</h1>

      {/* page layout */}
      <p className="text-foreground-secondary">Various lorem ipsum that's displayed on the dashboard page...</p>
      
    </div>
  )
}

export default DashboardPage