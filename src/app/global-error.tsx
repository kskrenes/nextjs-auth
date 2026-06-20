'use client';

import ErrorScreen, { ErrorProps } from "@/components/error-screen";

const GlobalError = ({ reset }: ErrorProps) => {
  return (
    <html lang="en">
      <body>
        <ErrorScreen reset={reset} isCritical={true} />
      </body>
    </html>
  )
}

export default GlobalError;