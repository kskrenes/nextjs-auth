"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link"
import AvatarDisplay from "./avatar-display";
import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

const Header = () => {

  const { user, loading, logout } = useAuth();

  return (
    <header className='fixed top-2 left-2 right-2 z-20 text-sm'>
      <div className='relative flex w-full max-w-6xl mx-auto z-30 rounded-xl px-3 h-[50px] items-center bg-gray-700/90 border-b border-gray-800 shadow-md'>

        {/* Home link / Logo */}
        <a href="/" className="flex select-none items-center gap-x-4 pl-2">
          {/* <ShieldUser size={26} className='text-gray-300/80' /> */}
          <img src="/nAuth-logo.png" alt="nAuth logo" width={29} height={29} className="hidden sm:block" />
          <div 
            aria-hidden="true" 
            className="hidden sm:block h-[1.625rem] w-[1px] bg-gray-600"
          />
        </a>

        <p className="ml-4 hidden sm:block font-semibold">
          {user ? `Welcome, ${user.username}!` : ''}
        </p>

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
          <div className="ml-auto flex items-center gap-6 font-medium mr-2">
            {user ? (
              <div className="flex items-center gap-2">
                <Menu>
                  <MenuButton className="cursor-pointer">
                    <AvatarDisplay publicId={user?.avatarId} size={36} />
                  </MenuButton>
                  <MenuItems className="absolute top-[50px] right-0 w-62 bg-gray-700/90 border border-gray-800 border-t-0 shadow-md">
                    <MenuItem>
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-800/50">
                        Profile
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link href="/triggerpasswordreset" className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-800/50">
                        Reset Password
                      </Link>
                    </MenuItem>
                    <hr className="border-t border-gray-600" />
                    <MenuItem>
                      <button 
                        className="w-full px-4 py-2 my-1 text-sm text-gray-200 hover:bg-gray-800/50 text-left cursor-pointer"
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