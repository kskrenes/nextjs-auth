import { User } from 'lucide-react';
import { CldImage } from 'next-cloudinary';
import { useState } from 'react';

export default function AvatarDisplay({ publicId }: { publicId: string }) {

  const [hasError, setHasError] = useState<boolean>(false);

  if (hasError) {
    return (
      <div className="w-52 h-52 rounded-full bg-slate-700 flex items-center justify-center">
        <User className='w-2/3 h-2/3 text-slate-500' />
      </div>
    );
  }

  return (
    <CldImage
      width="208"
      height="208"
      src={publicId}
      sizes="208px"
      alt="User Avatar"
      crop="thumb"      // Automatically crops to the most interesting part
      gravity="face"    // Ensures the face is centered in the avatar
      className="rounded-full"
      onError={() => setHasError(true)}
    />
  );
}
