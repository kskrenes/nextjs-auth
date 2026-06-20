'use client';

import ErrorScreen, { ErrorProps } from "@/components/error-screen";

const Error = ({ reset }: ErrorProps) => {
  return <ErrorScreen reset={reset} />
}

export default Error;