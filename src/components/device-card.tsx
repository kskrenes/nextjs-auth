"use client";
import { SessionDTO } from "@/helpers/session-dto";
import { useEffect, useState } from "react";
import axios from "axios";
import Badge from "./badge";
import Button from "./nae-button";
import { getDeviceIcon } from "./device-icons";
import NaeLoader from "./nae-loader";
import parseUserAgent from "@/helpers/parse-user-agent";
import toast from "react-hot-toast";

interface DeviceCardProps {
  session: SessionDTO;
  isCurrentSession: boolean;
  onSignOut: () => Promise<void>;
}

interface ExpandedSessionDTO extends SessionDTO {
  deviceInfo: {
    browser: string;
    os: string;
    deviceType: "mobile" | "desktop" | "tablet" | "console" | "embedded" | "smarttv" | "wearable" | "xr" | "unknown";
  };
}

const DeviceCard = ({ session, isCurrentSession, onSignOut }: DeviceCardProps) => {

  const [expandedSession, setExpandedSession] = useState<ExpandedSessionDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (session) {
      const deviceInfo = parseUserAgent(session.userAgent);
      setExpandedSession({
        ...session,
        deviceInfo,
      });
    }
  }, [session]);

  const deleteSession = async () => {
    try {
      setIsDeleting(true);
      await axios.delete("/api/auth/sessions/" + session.sessionId);
      await onSignOut();
      toast.success("Device signed out successfully");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to sign out of device");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex w-full gap-4 p-4 rounded-md bg-panel">
      {isDeleting || !expandedSession ? (
        <div className="flex w-full items-center justify-center py-8.5">
          <NaeLoader />
        </div>
      ) : (
        <>
          <div className="flex m-2">
            {getDeviceIcon(expandedSession.deviceInfo.deviceType) || getDeviceIcon('unknown')}
          </div>
          <div className="flex flex-col">
            <p className="text-foreground-primary">
              {expandedSession.deviceInfo.os}
              {isCurrentSession && <span className="ml-3"><Badge label="Current Session" variant="green" /></span>}
            </p>
            <p className="text-foreground-secondary">{expandedSession.deviceInfo.browser}</p>
            <p className="text-foreground-secondary">{expandedSession.ipAddress}</p>
            <p className="text-foreground-secondary">
              Last Active: {new Intl.DateTimeFormat('en-US').format(new Date(expandedSession.lastActive).getTime())}
            </p>
          </div>
          {!isCurrentSession && (
            <div className="ml-auto pr-1 pt-1">
              <Button 
                size="small" 
                className="ml-auto text-sm sm:text-base" 
                onClick={deleteSession}
              >
                Sign Out
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DeviceCard;