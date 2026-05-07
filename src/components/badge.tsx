import { twMerge } from "tailwind-merge";

interface BadgeProps {
  label: string;
  variant?: 'red' | 'green';
  className?: string;
}

const Badge = ({label, variant = 'red', className = ''}: BadgeProps) => {

  const baseStyles = "rounded-full bg-gradient-to-br px-3 py-1 text-white text-xs font-semibold text-shadow-sm cursor-default";

  const variantStyles = variant === 'red' 
    ? "from-red-500 to-red-600"
    : "from-green-600 to-green-700";

  return (
    <span className={twMerge(baseStyles, variantStyles, className)}>
      {label}
    </span>
  )
}

export default Badge;