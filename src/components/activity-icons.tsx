import { activityConfig } from "@/helpers/util/security-event-utils";
import { LucideProps } from "lucide-react";
import { twMerge } from "tailwind-merge";

type ActivityType = keyof typeof activityConfig;

interface ActivityIconProps extends LucideProps {
  type: ActivityType;
}

export const ActivityIcon = ({ 
  type,
  className,
  ...props 
}: ActivityIconProps) => {
  const config = activityConfig[type];
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
