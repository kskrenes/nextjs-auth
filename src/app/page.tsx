import BackgroundContainer from "@/components/background-container";
import Header from "@/components/header";

export default function Home() {
  return (
    <div className="flex min-h-screen font-sans">
      <BackgroundContainer>
        <Header />
        <main className="flex min-h-screen w-full max-w-5xl flex-col items-center sm:justify-between py-28 lg:py-38 px-8 sm:px-16 sm:items-start">
          <h1 className="font-bold text-white text-4xl/tight sm:text-6xl/tight text-center sm:text-left">
            Authentication built with Next.js and NextAuth
          </h1>

          {/* Show only for smaller screens */}
          <p className="sm:hidden text-lg sm:text-xl my-12 text-center">
            A fully featured authentication example, including OAuth, multifactor authentication, protected routes, session management, account verification, profile management, roles and permissions, and more.
          </p>
          

          {/* Show only for larger screens */}
          <div className="hidden sm:block text-gray-300 text-left">
            <p className="text-xl mb-6">
              A fully featured authentication example, including:
            </p>
            <ul className="list-disc list-inside mt-2 font-semibold text-xl/relaxed">
              <li>Email/password authentication</li>
              <li>Google OAuth authentication</li>
              <li>Multifactor authentication</li>
              <li>Protected routes and pages</li>
              <li>Session management</li>
              <li>Account verification</li>
              <li>Profile management</li>
              <li>Roles and permissions</li>
            </ul>
          </div>

          <a
            href="/signup"
            className="px-6 py-3 bg-blue-600 text-lg font-semibold text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </a>
        </main>
      </BackgroundContainer>
    </div>
  );
}
