import { ReactNode } from "react";
import bgImage from '../public/landing-bg-brand.jpg';

interface BGProps {
  children: ReactNode;
}

const BackgroundContainer: React.FC<BGProps> = ({ 
  children 
}) => {

  return (
    <div 
      className='min-h-screen w-full flex items-center relative overflow-hidden'
      style={{
        backgroundImage: `url(${bgImage.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center right",
      }}
    >
      {/* Left-side gradient overlay to ensure text legibility on smaller screens / when image bleeds through */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(10,14,60,0.92) 0%, rgba(10,14,60,0.70) 60%, rgba(10,14,60,0.40) 100%)",
        }}
      />

      {/* Content column — left-anchored on desktop, full-width on mobile */}
      <div className="relative z-10 w-full px-6 py-16 sm:px-10 md:px-16 lg:px-20 xl:px-28">
        {children}
      </div>
    </div>
  );
}

export default BackgroundContainer;