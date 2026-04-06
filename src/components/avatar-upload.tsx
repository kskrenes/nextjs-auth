"use client";

import { CldUploadWidget } from 'next-cloudinary';
import { useState } from 'react';
import AvatarDisplay from './avatar-display';
import { useAuth } from '@/context/AuthContext';

export default function AvatarUpload() {
  const [publicId, setPublicId] = useState<string | null>(null);
  const { user, updateUser } = useAuth();

  return (
    <div>
      <CldUploadWidget 
        uploadPreset="nae_avatar_preset"
        onSuccess={async (result) => {
          // The public_id is the unique identifier for the image
          if (typeof result.info !== 'string') {
            setPublicId(result.info?.public_id || null);
          }

          if (publicId) {
            await updateUser({ avatarId: publicId });
          }
        }}
      >
        {({ open }) => (
          <button onClick={() => open()}>Upload Avatar</button>
        )}
      </CldUploadWidget>

      {/* Display the uploaded avatar below */}
      {publicId && <AvatarDisplay publicId={publicId} />}
    </div>
  );
}