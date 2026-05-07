import { Cpu, Monitor, RectangleGoggles, Smartphone, Tablet, Tv, Watch } from "lucide-react";

// Map device keys to the Icon component references
const ICON_COMPONENTS = {
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

type DeviceType = keyof typeof ICON_COMPONENTS;

// Create a single factory function or component
export const getDeviceIcon = (type: DeviceType, size: 'small' | 'large' = 'large') => {
  const Icon = ICON_COMPONENTS[type];
  const className = size === 'large' ? "text-brand-light w-8 h-8" : "w-4 h-4";
  
  return <Icon className={className} />;
};