"use client";

import { CldUploadWidget } from 'next-cloudinary';
import AvatarDisplay from './avatar-display';
import { useAuth } from '@/context-providers/auth-context-provider';
import { Camera } from 'lucide-react';
import Button from './nae-button';
import toast from 'react-hot-toast';

export default function AvatarUpload() {

  const { user, updateUser } = useAuth();

  return (
    <div className="mx-auto rounded-full flex items-center justify-center relative">
      <CldUploadWidget 
        uploadPreset="ml_default"
        signatureEndpoint="/api/sign-cloudinary-params"
        onSuccess={async (result) => {
          if (typeof result.info !== 'string') {
            try {
              await updateUser({ avatarId: result.info?.public_id });
              toast.success('Avatar updated successfully');
            } catch {
              toast.error('Failed to update avatar');
            }
          }
        }}
      >
        {({ open }) => (
          <Button 
            onClick={() => open()}
            className='rounded-full h-9 w-9 px-0 py-0 absolute bottom-2 right-2'
          >
            <Camera className="w-6 h-6" strokeWidth={2} />
          </Button>
        )}
      </CldUploadWidget>

      {/* Display the uploaded avatar */}
      {user?.avatarId && <AvatarDisplay publicId={user.avatarId} size={208} />}
    </div>
  );
}