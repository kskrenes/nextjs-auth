import NavCaret from "./nav-caret"

interface NavItemProps {
  label: string;
  id: string;
}

const NavItem = ({
  label,
  id
}: NavItemProps) => {

  const baseStyles = 'flex items-center gap-x-[0.5rem] transition-colors';
  const colorStyles = 'text-gray-50 group-hover/navlist:text-gray-400 group-hover/navbutton:!text-white';

  return (
    <li className="relative flex">
      <button 
        id={id}
        className="group/navbutton flex pr-2 cursor-pointer" 
      >
        <span className={`${baseStyles} ${colorStyles}`}>
          {label}
          <NavCaret className={colorStyles} />
        </span>
      </button>
    </li>
  )
}

export default NavItem