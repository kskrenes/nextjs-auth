"use client";

import NaeLoader from "@/components/nae-loader";
import { ShieldAlert } from "lucide-react";
import DeviceCard from "./device-card";
import Button from "@/components/nae-button";
import SecurityLogCard from "./security-log-card";
import { useCallback, useEffect, useRef, useState } from "react";
import { SessionDTO } from "@/helpers/dto/session-dto";
import { SecurityLogDTO } from "@/helpers/dto/security-log-dto";
import { axiosClient } from "@/lib/axios-client";
import { getErrorMessage } from "@/helpers/util/error-utils";
import SignOutAllDevicesConfirmModal from "./sign-out-all-devices-confirm-modal";

const SecurityTab = () => {

  const [sessionsList, setSessionsList] = useState<SessionDTO[] | null>(null);
  const [securityLogs, setSecurityLogs] = useState<SecurityLogDTO[] | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [showSignOutAllConfirmation, setShowSignOutAllConfirmation] = useState(false);

  const isFetchingRef = useRef(false);

  const fetchTabData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setPending(true);
    setError('');
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
    catch (err) {
      setError(getErrorMessage(err, "Failed to load security data"));
    }
    finally {
      isFetchingRef.current = false;
    }
  }, [])

  useEffect(() => {fetchTabData()}, [fetchTabData])

  const handleSignOutAllSuccess = async () => {
    window.location.replace('/login');
  }

  return (
    <>
      {pending && !sessionsList && !securityLogs ? (
        <div 
          className='flex items-center justify-center mt-20'
          role='status'
          aria-live='polite'
          aria-busy='true'
        >
          <NaeLoader className='w-10 h-10' />
          <span className="sr-only">Loading security data...</span>
        </div>
      ) : error ? (
        <div role="alert" className="flex flex-col items-center gap-4 mt-4 px-4 text-red-500">
          <ShieldAlert className="w-10 h-10" />
          <span className="text-center">{error}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {sessionsList && sessionsList.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1 mb-1">
                <h2 className="text-lg font-semibold">My Devices</h2>
                <p className="text-foreground-secondary max-w-md text-sm">
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
                  onClick={() => {setShowSignOutAllConfirmation(true)}}
                  disabled={showSignOutAllConfirmation}
                >
                  Sign Out All Devices
                </Button>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 mb-1">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <p className="text-foreground-secondary max-w-md text-sm">
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
      <SignOutAllDevicesConfirmModal 
        open={showSignOutAllConfirmation}
        onOpenChange={setShowSignOutAllConfirmation}
        onCancel={() => setShowSignOutAllConfirmation(false)}
        onSuccess={handleSignOutAllSuccess}
      />
    </>
  )
}

export default SecurityTab