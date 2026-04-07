import { User } from 'lucide-react';
import { CldImage } from 'next-cloudinary';
import { useState } from 'react';

interface AvatarDisplayProps {
  publicId?: string;
  size: number;
  className?: string;
}

export default function AvatarDisplay({
  publicId = 'default_potato',
  size,
  className = '',
}: AvatarDisplayProps) {

  const [hasError, setHasError] = useState<boolean>(false);

  if (hasError) {
    return (
      <div 
        style={{ width: size, height: size }}
        className={`rounded-full bg-slate-700 flex items-center justify-center`}
      >
        <User className='w-2/3 h-2/3 text-slate-500' />
      </div>
    );
  }

  return (
    <CldImage
      width={size}
      height={size}
      src={publicId}
      sizes={`${size}px`}
      alt="User Avatar"
      crop="thumb"      // Automatically crops to the most interesting part
      gravity="face"    // Ensures the face is centered in the avatar
      className={`rounded-full ${className}`}
      onError={() => setHasError(true)}
    />
  );
}
