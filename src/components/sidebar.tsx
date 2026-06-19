"use client";

import { useAuth } from '@/context-providers/auth-context-provider';
import { LayoutDashboardIcon, LogIn, LogOut, UserPen } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation';
import LogoLink from './logo-link';

const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboardIcon /> },
  { name: 'Account', href: '/account', icon: <UserPen /> },
];

const Sidebar = () => {

  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside 
      className="p-4 w-64 fixed top-0 bottom-0 left-0 shrink-0 hidden md:block bg-panel" 
    >
      {/* home link / logo */}
      <LogoLink />

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
          {/* sign in or out item */}
          <li>
            {user ? (
              <button 
                className="nav-item"
                onClick={logout}
              >
                <LogOut />
                Sign Out
              </button>
            ) : (
              <Link 
                href="/login"
                className="nav-item"
              >
                <LogIn />
                Sign In
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar