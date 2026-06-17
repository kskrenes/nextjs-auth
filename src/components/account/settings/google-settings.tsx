"use client";

import { useAuth } from "@/context-providers/auth-context-provider";
import Button from "@/components/nae-button";
import { Plus } from "lucide-react";
import GoogleLoginButton from "../../google-login-button";
import { useState } from "react";
import GoogleUnlinkConfirmModal from "./google-unlink-confirm-modal";
import toast from "react-hot-toast";
import SettingsIcon from "./settings-icon";
import GoogleLogo from "@/components/google-logo";

const GoogleSettings = () => {

  const [showUnlinkConfirmModal, setShowUnlinkConfirmModal] = useState(false);

  const { user } = useAuth();

  if (!user) return;

  const hasGoogle = user.linkedProviders?.includes('google');

  const handleLinkSuccess = () => {
    toast.success("Google account added successfully!");
  }

  const handleLinkError = (message: string) => {
    toast.error(message);
  }

  return (
    <div className="p-5 flex items-start gap-4">

      {/* Icon */}
      <SettingsIcon icon={GoogleLogo} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4">

          {/* Title & Description */}
          <div>
            <p className="text-sm font-medium">Google</p>
            <p className="text-xs text-foreground-secondary mt-0.5">
              {hasGoogle 
                ? 'Linked to your Google account.' 
                : 'Sign in with your Google account.'
              }
            </p>
          </div>

          {/* Link/Unlink Button */}
          {hasGoogle ? (
            <Button
              onClick={() => setShowUnlinkConfirmModal(true)}
              size="small"
              variant="tertiary"
            >
              Unlink
            </Button>
          ) : (
            <div className="w-14 flex gap-2 items-center">
              <Plus className="w-4 h-4" />
              <GoogleLoginButton 
                type="icon" 
                size="medium" 
                callback={handleLinkSuccess} 
                onLoginError={handleLinkError}
              />
            </div>
          )}
        </div>
      </div>

      {/* Unlink Confirmation Dialog */}
      <GoogleUnlinkConfirmModal
        open={showUnlinkConfirmModal}
        onOpenChange={setShowUnlinkConfirmModal}
        onCancel={() => setShowUnlinkConfirmModal(false)}
        onSuccess={() => setShowUnlinkConfirmModal(false)}
      />
    </div>
  )
}

export default GoogleSettings