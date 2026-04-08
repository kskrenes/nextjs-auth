"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link"
import AvatarDisplay from "./avatar-display";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown, LayoutDashboardIcon, LogOut, RotateCcwKey, UserPen } from "lucide-react";
import { defaultTheme } from "@/helpers/themes";

const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboardIcon className="w-5 h-5" /> },
  { name: 'Profile', href: '/profile', icon: <UserPen className="w-5 h-5" /> },
  { name: 'Reset Password', href: '/triggerpasswordreset', icon: <RotateCcwKey className="w-5 h-5" /> },
];

const Header = () => {

  const { user, loading, logout } = useAuth();

  return (
    <header className='fixed top-0 left-64 right-0 z-20'>
      <div className='relative flex w-full mx-auto z-30 px-1 sm:px-3 items-center'>

        {/* right side actions */}
        {!loading && (
          <div className="ml-auto flex items-center p-2">

            {user ? (

              // authenticated view

              <div className="flex items-center gap-2">

                {/* user button / dropdown */}
                <Menu>
                  <MenuButton className="cursor-pointer hover:bg-gray-700 rounded-md transition-colors">
                    <div className="flex items-center p-2 gap-3">
                      <AvatarDisplay publicId={user?.avatarId} size={36} />
                      <div className="hidden sm:inline text-left">
                        {user?.name && <p className="font-medium">{user?.name}</p>}
                        <p className="text-sm text-gray-400">{user?.username}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 hidden sm:inline" />
                    </div>
                  </MenuButton>

                  {/* dropdown */}
                  <MenuItems 
                    style={{ backgroundColor: defaultTheme.panel }}
                    className="absolute top-[68px] py-1 right-5 w-64 rounded-md text-gray-400"
                  >
                    {/* nav links */}
                    {navLinks.map((link) => (
                      <MenuItem key={`user-nav-${link.name}`}>
                        <Link href={link.href} className="flex items-center px-4 py-2 gap-2 hover:bg-gray-700">
                          {link.icon}
                          {link.name}
                        </Link>
                      </MenuItem>
                    ))}

                    <hr className="border-t border-gray-700/50 my-1" />

                    {/* sign out button */}
                    <MenuItem>
                      <button 
                        className="w-full block px-4 py-2 hover:bg-gray-700 text-left cursor-pointer"
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

              <div className="flex items-center gap-2">
                {/* sign in button */}
                <Link 
                  href="/login" 
                  className="rounded-md px-2.5 py-0.5 text-gray-50 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer" 
                >
                  Sign In
                </Link>
                {/* sign up button */}
                <Link 
                  href="/signup" 
                  className="rounded-md px-2.5 py-0.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer" 
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