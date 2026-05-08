import parseUserAgent from "@/helpers/parse-user-agent";
import { SecurityLogDTO } from "@/helpers/security-log-dto"
import { useTimeTick } from "@/hooks/useTimeTick";
import { useEffect, useState } from "react";
import NaeLoader from "./nae-loader";
import { ActivityIcon } from "./activity-icons";
import { activityConfig } from "@/helpers/activity-config";
import { DeviceIcon } from "./device-icons";
import { formatRelativeTime } from "@/helpers/time-utils";

interface SecurityLogCardProps {
  securityLog: SecurityLogDTO
}

interface ExpandedSecurityLogDTO extends SecurityLogDTO {
  deviceInfo: {
    browser: string;
    os: string;
    deviceType: "mobile" | "desktop" | "tablet" | "console" | "embedded" | "smarttv" | "wearable" | "xr" | "unknown";
  };
}

const SecurityLogCard = ({ securityLog }: SecurityLogCardProps) => {

  const [expandedSecurityLog, setExpandedSecurityLog] = useState<ExpandedSecurityLogDTO | null>(null);

  // re-render whenever the global timer ticks, updating the relative time display
  useTimeTick(60000);

  useEffect(() => {
    if (securityLog) {
      const deviceInfo = parseUserAgent(securityLog.userAgent);
      setExpandedSecurityLog({
        ...securityLog,
        deviceInfo,
      });
    }
  }, [securityLog]);

  return (
    <div className="flex w-full gap-5 p-5 rounded-md bg-panel">
      {!expandedSecurityLog ? (
        <div className="flex w-full items-center justify-center py-8.5">
          <NaeLoader />
        </div>
      ) : (
        <>
          <ActivityIcon type={expandedSecurityLog.action} />
          <div className="flex flex-col gap-1">
            <h3 className="text-foreground-primary text-lg">
              {activityConfig[expandedSecurityLog.action].label}
            </h3>

            <div className="flex items-center text-foreground-secondary flex-wrap">
              <div className="flex items-center gap-2">
                <DeviceIcon type={expandedSecurityLog.deviceInfo.deviceType} sizeVariant="small" />
                <span>{expandedSecurityLog.deviceInfo.os}</span>
              </div>
              <span className="px-2">•</span>
              <span>{expandedSecurityLog.deviceInfo.browser}</span>
              <span className="px-2">•</span>
              <span className="font-mono">{expandedSecurityLog.ipAddress}</span>
            </div>

            <p className="text-foreground-secondary">
              {formatRelativeTime(new Date(expandedSecurityLog.createdAt))}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default SecurityLogCard