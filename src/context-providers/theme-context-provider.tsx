"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

export const NaeThemeProvider = ({children}: {children: ReactNode}) => {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}