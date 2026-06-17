import { defaultAvatarId } from '@/helpers/util/avatar-utils';
import { cn } from '@/helpers/util/classname-util';
import { User } from 'lucide-react';
import { CldImage } from 'next-cloudinary';
import { useState } from 'react';

const sizeMap = {
  sm: { px: 36, class: 'w-9 h-9' },
  lg: { px: 208, class: 'w-52 h-52' },
};

interface AvatarDisplayProps {
  publicId?: string;
  size: keyof typeof sizeMap;
  className?: string;
}

export default function AvatarDisplay({
  publicId = defaultAvatarId,
  size,
  className = '',
}: AvatarDisplayProps) {

  const [hasError, setHasError] = useState<boolean>(false);
  const currentSize = sizeMap[size];

  if (hasError) {
    return (
      <div 
        className={cn(
          currentSize.class, 
          "rounded-full bg-slate-700 flex items-center justify-center", 
          className
        )}
      >
        <User className='w-2/3 h-2/3 text-slate-500' />
      </div>
    );
  }

  return (
    <CldImage
      width={currentSize.px}
      height={currentSize.px}
      src={publicId}
      sizes={`${currentSize.px}px`}
      alt="User Avatar"
      crop="thumb"      // Automatically crops to the most interesting part
      gravity="face"    // Ensures the face is centered in the avatar
      className={`rounded-full ${className}`}
      onError={() => setHasError(true)}
    />
  );
}
