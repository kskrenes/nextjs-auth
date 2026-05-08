import { activityConfig } from "@/helpers/activity-config";
import { LucideProps } from "lucide-react";

type ActivityType = keyof typeof activityConfig;

interface ActivityIconProps extends LucideProps {
  type: ActivityType;
}

export const ActivityIcon = ({ 
  type,
  ...props 
}: ActivityIconProps) => {
  const config = activityConfig[type];
  const Icon = config.icon;

  return (
    <div className={`p-3 ${config.bg} rounded-lg h-fit`}>
      <Icon 
        className={`w-6 h-6 ${config.color}`} 
        {...props} 
      />
    </div>
  );
};
