"use client";

import { useAuth } from "@/context-providers/auth-context-provider";
import AvatarUpload from "../avatar-upload";
import NaeLoader from "../nae-loader";
import Button from "../nae-button";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { triggerEmail } from "@/helpers/util/email-trigger";
import toast from "react-hot-toast";

interface ProfilePanelProps {
  editing: boolean;
  onEditClick: () => void;
}

const ProfilePanel = ({ editing, onEditClick }: ProfilePanelProps) => {

  const [sendingEmail, setSendingEmail] = useState(false);

  const handleVerifyClick = async () => {
    if (sendingEmail || !user) return;

    try {
      await triggerEmail(user.email, "VERIFY", setSendingEmail);
      toast.success("Verification email sent");
    } catch {
      toast.error("Failed to send verification email");
    }
  }

  const { user } = useAuth();

  return (
    <div 
      className="panel flex w-full px-6 py-12 gap-8 mb-6 min-w-0 flex-col" 
    >
      {!user ? (
        <div className="flex justify-center items-center h-95">
          <NaeLoader />
        </div>
      ) : (
        <>
          {/* avatar */}
          <AvatarUpload />

          {/* name/username group */}
          <div className="flex min-w-0 flex-col gap-1 items-center">

            {/* name */}
            {user.name && (
              <div className="flex justify-center items-center max-w-55 xs:max-w-80 gap-2 w-full">
                <h1 className="text-2xl xs:text-3xl truncate font-semibold wrap-break-word line-clamp-1">{user.name}</h1>
              </div>
            )}

            {/* username */}
            <div className="flex justify-center items-center max-w-55 xs:max-w-80 gap-2 w-full">
              <p className="text-foreground-secondary text-lg xs:text-xl break-all line-clamp-1">{user.username}</p>
            </div>
          </div>

          {/* button group */}
          <div className="flex gap-4 justify-center mx-auto w-full max-w-80">
            
            {/* edit button - always visible */}
            <Button 
              className="flex-1 gap-2 px-0"
              onClick={onEditClick}
              disabled={editing}
            >
              <Pencil className="w-5 h-5" />
              Edit Profile
            </Button>

            {/* verify email button - conditional */}
            {!user.isVerified && !user.linkedProviders.includes('google') && (
              <Button 
                className="flex-1 px-0" 
                variant="secondary"
                onClick={handleVerifyClick}
                disabled={sendingEmail}
              >
                Verify Email
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ProfilePanel