'use client';

import ErrorScreen, { ErrorProps } from "@/components/error-screen";

const GlobalError = ({ reset }: ErrorProps) => {
  return <ErrorScreen reset={reset} isCritical={true} />
}

export default GlobalError;