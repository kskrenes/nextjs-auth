interface BadgeProps {
  label: string;
  variant?: 'red' | 'green';
}

const Badge = ({label, variant = 'red'}: BadgeProps) => {

  const baseStyles = "rounded-full bg-gradient-to-br px-3 py-1 text-white text-xs font-semibold text-shadow-sm cursor-default";

  const variantStyles = variant === 'red' 
    ? "from-red-500 to-red-600"
    : "from-green-500 to-green-600";

  return (
    <span className={`${baseStyles} ${variantStyles}`}>
      {label}
    </span>
  )
}

export default Badge;