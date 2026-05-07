"use client";
import parseUserAgent from "@/helpers/parse-user-agent";
import { SessionDTO } from "@/helpers/session-dto";
import { Cpu, Monitor, RectangleGoggles, Smartphone, Tablet, Tv, Watch } from "lucide-react";
import { ReactElement, useEffect, useState } from "react";
import Badge from "./badge";
import Button from "./nae-button";
import axios from "axios";
import toast from "react-hot-toast";
import NaeLoader from "./nae-loader";

interface DeviceCardProps {
  session: SessionDTO;
  isCurrentSession: boolean;
  onSignOut: () => Promise<void>;
}

interface ExpandedSessionDTO extends SessionDTO {
  deviceInfo: {
    browser: string;
    os: string;
    deviceType: string;
  };
}

const deviceIconMap: { [key: string]: ReactElement } = {
  mobile: <Smartphone className="text-brand-light w-8 h-8" />,
  desktop: <Monitor className="text-brand-light w-8 h-8" />,
  tablet: <Tablet className="text-brand-light w-8 h-8" />,
  unknown: <Monitor className="text-brand-light w-8 h-8" />,
  embedded: <Cpu className="text-brand-light w-8 h-8" />,
  smarttv: <Tv className="text-brand-light w-8 h-8" />,
  wearable: <Watch className="text-brand-light w-8 h-8" />,
  xr: <RectangleGoggles className="text-brand-light w-8 h-8" />,
};

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
            {deviceIconMap[expandedSession.deviceInfo.deviceType] || deviceIconMap['unknown']}
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