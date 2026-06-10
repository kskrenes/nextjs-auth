import { Cpu, Monitor, RectangleGoggles, Smartphone, Tablet, Tv, Watch, LucideProps } from "lucide-react";
import { twMerge } from "tailwind-merge";

const ICON_MAP = {
  mobile: Smartphone,
  desktop: Monitor,
  tablet: Tablet,
  console: Monitor,
  unknown: Monitor,
  embedded: Cpu,
  smarttv: Tv,
  wearable: Watch,
  xr: RectangleGoggles,
} as const;

type DeviceType = keyof typeof ICON_MAP;

interface DeviceIconProps extends LucideProps {
  type: DeviceType;
  sizeVariant?: 'small' | 'large';
}

export const DeviceIcon = ({ 
  type, 
  sizeVariant = 'large', 
  className,
  ...props 
}: DeviceIconProps) => {
  const Icon = ICON_MAP[type];
  
  const variantIconStyles = sizeVariant === 'large' 
    ? "text-foreground-secondary w-6 h-6" 
    : "w-4 h-4";

  const variantContainerStyles = sizeVariant === 'large' 
    ? "p-3 bg-panel-brand rounded-lg h-fit" 
    : "";

  return (
    <div className={variantContainerStyles}>
      <Icon 
        className={twMerge(variantIconStyles, className)} 
        {...props} 
      />
    </div>
  );
};
