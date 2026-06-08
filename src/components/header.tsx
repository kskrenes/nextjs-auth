"use client";

import { useAuth } from "@/context-providers/auth-context-provider";
import Link from "next/link"
import AvatarDisplay from "./avatar-display";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown, LayoutDashboardIcon, LogOut, UserPen } from "lucide-react";
import ThemeSwitcher from "./theme-switcher";
import { useSelectedLayoutSegments } from "next/navigation";

const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboardIcon className="w-5 h-5" /> },
  { name: 'Account', href: '/account', icon: <UserPen className="w-5 h-5" /> },
];

const Header = () => {

  const { user, fetchingUser, loggingIn, logout } = useAuth();

  const segments = useSelectedLayoutSegments();
  const isLanding = segments.length === 0;
  const isMainGroup = segments.includes('(main)');

  const headerBG = isLanding ? 'bg-black/5' : 'bg-page/50';
  const headerLeft = isMainGroup ? 'md:left-64' : 'md:left-0';

  return (
    <header className={`fixed top-0 left-0 right-0 z-20 ${headerLeft} ${headerBG} backdrop-blur-xs`}>
      <div className='relative flex w-full mx-auto z-30 px-1 sm:px-3 items-center min-h-19'>

        {/* Theme Switcher */}
        <div className="flex items-center px-2">
          {!isLanding && <ThemeSwitcher />}
        </div>

        {/* right side actions */}
        {!(fetchingUser || loggingIn) && (
          <div className="ml-auto flex items-center p-2">

            {user ? (

              // authenticated view

              <div className="flex items-center gap-2">

                {/* user button / dropdown */}
                <Menu>
                  <MenuButton 
                    aria-label="Open user menu"
                    className="nav-item p-0 focus:outline-none"
                  >
                    <div className="flex items-center p-2 gap-3">
                      <AvatarDisplay publicId={user?.avatarId} size={36} />
                      <div className="hidden sm:inline text-left">
                        {user?.name && <p className="font-medium text-foreground-primary max-w-60 wrap-break-word line-clamp-1">{user?.name}</p>}
                        <p className="text-sm max-w-60 break-all line-clamp-1">{user?.username}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 hidden sm:inline" />
                    </div>
                  </MenuButton>

                  {/* dropdown */}
                  <MenuItems 
                    className="absolute top-17 right-5 w-60 rounded-md bg-panel focus:outline-none"
                  >
                    {/* nav links */}
                    {navLinks.map((link) => (
                      <MenuItem key={`user-nav-${link.name}`}>
                        <Link href={link.href} className="nav-item">
                          {link.icon}
                          {link.name}
                        </Link>
                      </MenuItem>
                    ))}

                    <hr className="border-t border-panel-highlight my-1" />

                    {/* sign out button */}
                    <MenuItem>
                      <button 
                        type="button"
                        className="nav-item"
                        onClick={logout}
                      >
                        <LogOut className="w-5 h-5 inline mr-2" />
                        Sign Out
                      </button>
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </div>
            ) : (

              // unauthenticated view

              <div className="flex items-center gap-6">
                {/* sign in button */}
                <Link 
                  href="/login" 
                  className="input-link text-base"
                >
                  Sign In
                </Link>
                {/* sign up button */}
                <Link 
                  href="/signup" 
                  className="button-primary button-small" 
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  )
}

export default Header