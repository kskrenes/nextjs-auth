"use client";

import NaeLoader from "@/components/nae-loader";
import { ShieldAlert } from "lucide-react";
import DeviceCard from "./device-card";
import Button from "@/components/nae-button";
import SecurityLogCard from "./security-log-card";
import { useCallback, useEffect, useState } from "react";
import { SessionDTO } from "@/helpers/dto/session-dto";
import { SecurityLogDTO } from "@/helpers/dto/security-log-dto";
import { axiosClient } from "@/lib/axios-client";
import { getErrorMessage } from "@/helpers/util/error-utils";
import toast from "react-hot-toast";
import { useAuth } from "@/context-providers/auth-context-provider";

const SecurityTab = () => {

  const [sessionsList, setSessionsList] = useState<SessionDTO[] | null>(null);
  const [securityLogs, setSecurityLogs] = useState<SecurityLogDTO[] | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingSecurityData, setIsLoadingSecurityData] = useState(false);
  const [isSecurityDataError, setIsSecurityDataError] = useState(false);
  const [securityDataErrorMessage, setSecurityDataErrorMessage] = useState('');
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const { logout } = useAuth();

  const fetchTabData = useCallback(async () => {
    if (isLoadingSecurityData) return;

    setIsLoadingSecurityData(true);
    setIsSecurityDataError(false);
    try {
      // fetch sessions and security logs
      const [sessionsResponse, logsResponse] = await Promise.all([
        axiosClient.get("/api/auth/sessions"),
        axiosClient.get("/api/users/security-logs")
      ]);
      setCurrentSessionId(sessionsResponse.data.currentSessionId);
      setSessionsList(sessionsResponse.data.sessions);
      setSecurityLogs(logsResponse.data.securityLogs);
    }
    catch (error) {
      console.error("Failed to load security tab data", error);
      setIsSecurityDataError(true);
      setSecurityDataErrorMessage(getErrorMessage(error, "Failed to load security data"));
    }
    finally {
      setIsLoadingSecurityData(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {fetchTabData()}, [fetchTabData])

  const handleSignOutAllDevices = async () => {
    if (isRevokingAll) return;

    if (window.confirm("Are you sure you want to sign out all devices? You will be signed out from your current session.")) {
      setIsRevokingAll(true);
      try {
        const response = await axiosClient.post("/api/auth/logout-all");
        const count = response.data.deletedCount;
        toast.success(`Signed out of ${count} device${count > 1 ? 's' : ''}`);
        await logout();
      } catch (error) {
        console.error("Failed to sign out of all devices:", error);
        toast.error("Failed to sign out of all devices");
      } finally {
        setIsRevokingAll(false);
      }
    }
  }

  return (
    <>
      {isLoadingSecurityData && !sessionsList && !securityLogs ? (
        <div 
          className='flex items-center justify-center mt-20'
          role='status'
          aria-live='polite'
          aria-busy='true'
        >
          <NaeLoader className='w-10 h-10' />
          <span className="sr-only">Loading security data...</span>
        </div>
      ) : isSecurityDataError ? (
        <div role="alert" className="flex flex-col items-center gap-4 mt-4 px-4 text-red-500">
          <ShieldAlert className="w-10 h-10" />
          <span className="text-center">{securityDataErrorMessage}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {sessionsList && sessionsList.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1 mb-1">
                <label className="text-lg font-semibold">My Devices</label>
                <p className="text-foreground-secondary max-w-md">
                  Manage your active sessions across all devices.
                </p>
              </div>
              {sessionsList.map((session) => (
                <DeviceCard 
                  key={session.sessionId} 
                  session={session} 
                  isCurrentSession={currentSessionId === session.sessionId} 
                  onSignOut={fetchTabData}
                />
              ))}
              <div className="mt-2">
                <Button 
                  size="small"
                  variant="extreme"
                  onClick={handleSignOutAllDevices}
                  disabled={isRevokingAll}
                >
                  Sign Out All Devices
                </Button>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 mb-1">
              <label className="text-lg font-semibold">Recent Activity</label>
              <p className="text-foreground-secondary max-w-md">
                A log of recent activities on your account.
              </p>
            </div>
            {securityLogs && securityLogs.length > 0 ? (
              <>
              {securityLogs.map((log, index) => (
                <SecurityLogCard 
                  key={new Date(log.createdAt).getTime() + index}
                  securityLog={log}
                />
              ))}
              </>
            ) : (
              <p>No recent security activity.</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default SecurityTab