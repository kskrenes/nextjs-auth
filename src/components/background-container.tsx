import Image from "next/image";
import { ReactNode } from "react";
import bgImage from '../public/landing-bg.jpg';

interface BGProps {
  children: ReactNode;
}

const BackgroundContainer: React.FC<BGProps> = ({ 
  children 
}) => {

  return (
    <div className='relative w-full h-screen'>
      <Image
        src={bgImage}
        alt=''
        fill
        className='object-cover -z-10'
        priority
      />
      <div className='relative'>{children}</div>
    </div>
  );
}

export default BackgroundContainer;