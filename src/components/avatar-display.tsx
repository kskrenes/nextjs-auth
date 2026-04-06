import { CldImage } from 'next-cloudinary';

export default function AvatarDisplay({ publicId }: { publicId: string }) {
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
    />
  );
}
