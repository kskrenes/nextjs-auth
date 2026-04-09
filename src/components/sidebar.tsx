"use client";

import { useAuth } from '@/context/AuthContext';
import { LayoutDashboardIcon, LogOut, RotateCcwKey, UserPen } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation';

const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboardIcon /> },
  { name: 'Profile', href: '/profile', icon: <UserPen /> },
  { name: 'Reset Password', href: '/triggerpasswordreset', icon: <RotateCcwKey /> },
];

const Sidebar = () => {

  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside 
      className="p-4 w-64 shrink-0 hidden md:block bg-panel" 
    >
      {/* home link / logo */}
      <Link href="/" className="flex select-none items-center gap-2 m-4">
        <div className="w-7.25 h-7.25 bg-logo bg-contain bg-no-repeat" />
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
                  className={`${isActive ? 'nav-item-selected' : 'nav-item'}`}
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
              className="nav-item"
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