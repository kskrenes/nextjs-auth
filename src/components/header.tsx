import { ShieldUser } from "lucide-react"
import NavItem from "./nav-item"

const Header = () => {
  return (
    <header className='fixed top-2 left-2 right-2 z-20 text-sm'>
      <div className='relative flex w-full max-w-6xl mx-auto z-30 rounded-xl px-3 py-3 items-center bg-gray-900/90 border-b border-blue-950 shadow-md'>

        {/* Home link / Logo */}
        <a href="/" className="flex select-none items-center gap-x-4 pl-2">
          <ShieldUser size={26} className='text-gray-300/80' />
          <div 
            aria-hidden="true" 
            className="box-content hidden md:block h-[1.625rem] w-[0.5px] border-r-[0.5px] border-solid border-blue-950 bg-gray-800"
          />
        </a>

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
        <div className="ml-auto flex items-center gap-6 font-medium">
          <div className="flex items-center gap-2">
            <div>
              <a 
                href="/login" 
                className="rounded-md px-2.5 py-1 text-gray-50 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer" 
                target=""
              >
                Sign In
              </a>
            </div>
            <div>
              <a 
                href="/signup" 
                className="rounded-md px-2.5 py-1 font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer" 
                target=""
              >
                Get Started
              </a>
            </div>
          </div>
        </div>

      </div>
    </header>
  )
}

export default Header