"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link"
import AvatarDisplay from "./avatar-display";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import { defaultTheme } from "@/helpers/themes";

const Header = () => {

  const { user, loading, logout } = useAuth();

  return (
    <header className='fixed top-0 left-65 right-0 z-20'>
      <div className='relative flex w-full mx-auto z-30 px-1 sm:px-3 items-center'>

        {/* Home link / Logo */}
        {/* <a href="/" className="flex select-none items-center gap-x-4 pl-2">
          <Image src="/nAuth-logo.png" alt="nAuth logo" width={29} height={29} />
          <div 
            aria-hidden="true" 
            className="hidden sm:block h-[1.625rem] w-[1px] bg-gray-600"
          />
        </a> */}

        {/* <p className="ml-4 hidden sm:block font-semibold">
          {user ? `Welcome, ${user.username}!` : ''}
        </p> */}

        {/* Header nav */}
        {/* example usage, not currently in scope */}
        {/* <nav 
          aria-label="Main" 
          className="ml-4 hidden md:block"
        >
          <div className="relative">
            <ul 
              data-orientation="horizontal" 
              className="group/navlist flex items-center text-gray-950 gap-2" 
              dir="ltr"
            >
              <NavItem label="Products" id="header-nav-products-trigger" />
              <NavItem label="Solutions" id="header-nav-solutions-trigger" />
              <NavItem label="Resources" id="header-nav-resources-trigger" />
            </ul>
          </div>
        </nav> */}

        {/* Right side actions */}
        {!loading && (
          <div className="ml-auto flex items-center p-2">
            {user ? (
              <div className="flex items-center gap-2">
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
                  <MenuItems 
                    style={{ backgroundColor: defaultTheme.panel }}
                    className="absolute top-[68px] py-1 right-5 w-62 rounded-md text-gray-400"
                  >
                    <MenuItem>
                      <Link href="/profile" className="block px-4 py-2 hover:bg-gray-700">
                        Profile
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link href="/triggerpasswordreset" className="block px-4 py-2 hover:bg-gray-700">
                        Reset Password
                      </Link>
                    </MenuItem>
                    <hr className="border-t border-gray-700/50 my-1" />
                    <MenuItem>
                      <button 
                        className="w-full block px-4 py-2 hover:bg-gray-700 text-left cursor-pointer"
                        onClick={logout}
                      >
                        Sign Out
                      </button>
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/login" 
                  className="rounded-md px-2.5 py-0.5 text-gray-50 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer" 
                >
                  Sign In
                </Link>
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