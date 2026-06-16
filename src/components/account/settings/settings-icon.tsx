import { type ComponentType, type ReactElement, isValidElement } from 'react';

// Define a safe type for any icon component that accepts SVG props
type IconComponentType = ComponentType<React.ComponentPropsWithoutRef<'svg'>>;

interface SettingsIconProps {
  // Explicit types only: component definition OR a pre-rendered JSX element
  icon: IconComponentType | ReactElement;
}

const SettingsIcon = ({ icon }: SettingsIconProps) => {
  // Safely handle pre-rendered JSX elements (e.g., <svg>...</svg>)
  if (isValidElement(icon)) {
    return (
      <div className="mt-0.5 p-2 bg-panel-brand rounded-lg">
        {icon}
      </div>
    );
  }

  // Safely handle component references (e.g., Lucide or Custom SVG Components)
  const IconComponent = icon;

  return (
    <div className="mt-0.5 p-2 bg-panel-brand rounded-lg">
      <IconComponent className="w-4 h-4 text-foreground-secondary" />
    </div>
  );
};

export default SettingsIcon;