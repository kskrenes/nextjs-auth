import { Cpu, Monitor, RectangleGoggles, Smartphone, Tablet, Tv, Watch, LucideProps } from "lucide-react";

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
  className = '', 
  ...props 
}: DeviceIconProps) => {
  const Icon = ICON_MAP[type];
  
  // Combine your base styles with any extra classes passed in via props
  const variantStyles = sizeVariant === 'large' 
    ? "text-brand-light w-8 h-8" 
    : "w-4 h-4";

  return (
    <Icon 
      className={`${variantStyles} ${className}`} 
      {...props} 
    />
  );
};
