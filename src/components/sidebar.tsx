"use client";

import { useAuth } from '@/context/AuthContext';
import { defaultTheme } from '@/helpers/themes'
import { LayoutDashboardIcon, LogOut, RotateCcwKey, UserPen } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation';

const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboardIcon /> },
  { name: 'Profile', href: '/profile', icon: <UserPen /> },
  { name: 'Reset Password', href: '/triggerpasswordreset', icon: <RotateCcwKey /> },
];

const interactiveStyles = 'text-gray-400 hover:bg-gray-700';
const selectedStyles = 'text-gray-900 bg-gray-100';
const navItemStyles = 'flex items-center gap-2 px-4 py-3.5 rounded-md';

const Sidebar = () => {

  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside 
      className="p-4 w-64 flex-shrink-0 hidden md:block" 
      style={{ backgroundColor: defaultTheme.panel }}
    >
      {/* home link / logo */}
      <Link href="/" className="flex select-none items-center gap-2 m-4">
        <Image src="/nAuth-logo.png" alt="nAuth logo" width={29} height={29} />
        <span className="hidden sm:block text-lg font-bold">
          nAuth
        </span>
      </Link>

      {/* main nav */}
      <nav className="mt-24">
        <ul className='flex flex-col gap-1'>

          {/* internal links */}
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={`sidebar-link-${link.name}`}>
                <Link 
                  href={link.href}
                  className={`${navItemStyles} ${isActive ? selectedStyles : interactiveStyles}`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              </li>
            )
          })}
          {/* sign out item */}
          <li>
            <button 
              className={`${navItemStyles} ${interactiveStyles} w-full cursor-pointer`}
              onClick={logout}
            >
              <LogOut />
              Sign Out
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar