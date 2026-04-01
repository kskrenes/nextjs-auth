interface NavCaretProps {
  className?: string;
}

const NavCaret = ({
  className = ''
}: NavCaretProps) => {

  const caretPath = `M6.17574 0.175736C6.41005 -0.0585787 6.78908 -0.0585787 7.02339 
    0.175736C7.25771 0.410051 7.25771 0.789078 7.02339 1.02339L4.7314 3.31636C4.10656 
    3.9412 3.09257 3.9412 2.46773 3.31636L0.175736 1.02339C-0.0585787 0.789078 -0.0585787 
    0.410051 0.175736 0.175736C0.410051 -0.0585787 0.789078 -0.0585787 1.02339 0.175736L3.31636 
    2.46773C3.47257 2.62394 3.72656 2.62394 3.88277 2.46773L6.17574 0.175736Z`;

  const baseStyles = 'absolute inset-0 h-full w-full transition-colors';

  return (
    <span className="relative flex h-[0.25rem] w-[0.5rem] items-center justify-center">
      <svg 
        aria-hidden="true" 
        viewBox="0 0 8 4" 
        fill="none" 
        className={`${baseStyles} ${className}`}
      >
        <path 
          d={caretPath}
          fill="currentColor"
        />
      </svg>
    </span>
  )
}

export default NavCaret