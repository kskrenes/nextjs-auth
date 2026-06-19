import Link from 'next/link';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-page p-6">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8 text-foreground-secondary text-center max-w-md">
        We’re sorry, but the page you are looking for has been removed, had its name changed, or is temporarily unavailable.
      </p>
      
      <Link href="/" aria-label="Home" className="button-primary button-standard">
        Return to Homepage
      </Link>
    </div>
  );
}

export default NotFound;