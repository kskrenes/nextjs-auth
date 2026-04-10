"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const themeItems = [
  { name: "light", label: "Light", icon: <Sun className="w-5 h-5" /> },
  { name: "dark", label: "Dark", icon: <Moon className="w-5 h-5" /> },
  { name: "system", label: "System", icon: <Monitor className="w-5 h-5" /> },
];

const ThemeSwitcher = () => {

  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const activeThemeItem =
    themeItems.find((item) => item.name === theme) ??
    themeItems.find((item) => item.name === "system");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <Menu>
      <MenuButton 
        aria-label="Open theme menu"
        className="nav-item p-0 focus:outline-none"
      >
        <div className="flex items-center pl-2 pr-1 py-2 gap-1">
          {activeThemeItem?.icon}
          <ChevronDown className="w-4 h-4" />
        </div>
      </MenuButton>

      {/* dropdown */}
      <MenuItems 
        className="absolute top-14 left-5 w-40 rounded-md bg-panel focus:outline-none"
      >
        {/* nav links */}
        {themeItems.map((item) => (
          <MenuItem 
            as="button"
            type="button"
            key={`theme-item-${item.name}`}
            className="nav-item"
            onClick={() => setTheme(item.name)}
          >
            {item.icon}
            {item.label}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  )
}

export default ThemeSwitcher