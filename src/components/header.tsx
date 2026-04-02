"use client";

import { useAuth } from "@/context/AuthContext";
import { ShieldUser } from "lucide-react"
import Link from "next/link"

const Header = () => {

  const { user, loading, logout } = useAuth();

  return (
    <header className='fixed top-2 left-2 right-2 z-20 text-sm'>
      <div className='relative flex w-full max-w-6xl mx-auto z-30 rounded-xl px-3 py-3 items-center bg-gray-900/90 border-b border-blue-950 shadow-md'>

        {/* Home link / Logo */}
        <a href="/" className="flex select-none items-center gap-x-4 pl-2">
          <ShieldUser size={26} className='text-gray-300/80' />
          <div 
            aria-hidden="true" 
            className="box-content hidden sm:block h-[1.625rem] w-[0.5px] border-r-[0.5px] border-solid border-blue-950 bg-gray-800"
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
          <div className="ml-auto flex items-center gap-6 font-medium">
            {user ? (
              <div className="flex items-center gap-2">
                <div>
                  <button 
                    onClick={logout}
                    className="rounded-md px-2.5 py-0.5 text-gray-50 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer" 
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div>
                  <Link 
                    href="/login" 
                    className="rounded-md px-2.5 py-1 text-gray-50 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer" 
                    target=""
                  >
                    Sign In
                  </Link>
                </div>
                <div>
                  <Link 
                    href="/signup" 
                    className="rounded-md px-2.5 py-1 font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer" 
                    target=""
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            )}
          
          </div>
        )}

      </div>
    </header>
  )
}

export default Header