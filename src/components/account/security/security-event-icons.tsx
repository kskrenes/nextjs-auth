import { securityEventConfig, SecurityEventType } from "@/helpers/util/security-event-utils";
import { LucideProps } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface SecurityEventIconProps extends LucideProps {
  type: SecurityEventType;
}

export const SecurityEventIcon = ({ 
  type,
  className,
  ...props 
}: SecurityEventIconProps) => {
  const config = securityEventConfig[type];
  const Icon = config.icon;

  const iconStyles = `w-6 h-6 ${config.color}`;

  return (
    <div className={`p-3 ${config.bg} rounded-lg h-fit`}>
      <Icon 
        className={twMerge(iconStyles, className)} 
        {...props} 
      />
    </div>
  );
};
