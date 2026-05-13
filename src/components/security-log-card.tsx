import { parseUserAgent } from "@/helpers/util/request-utils";
import { SecurityLogDTO } from "@/helpers/dto/security-log-dto"
import { useTimeTick } from "@/hooks/useTimeTick";
import { useMemo } from "react";
import { ActivityIcon } from "./activity-icons";
import { activityConfig } from "@/helpers/util/security-event-utils";
import { DeviceIcon } from "./device-icons";
import { formatRelativeTime } from "@/helpers/util/time-utils";

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

  // re-render whenever the global timer ticks, updating the relative time display
  useTimeTick(60000);

  const expandedSecurityLog: ExpandedSecurityLogDTO = useMemo(() => ({
    ...securityLog,
    deviceInfo: parseUserAgent(securityLog.userAgent),
  }), [securityLog]);

  return (
    <div className="flex w-full gap-5 p-5 rounded-md bg-panel">
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
    </div>
  )
}

export default SecurityLogCard