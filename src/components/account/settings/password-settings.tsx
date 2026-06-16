"use client";

import { useAuth } from "@/context-providers/auth-context-provider";
import { triggerEmail } from "@/helpers/util/email-trigger";
import { useState } from "react";
import toast from "react-hot-toast";
import PasswordLinkModal from "./password-link-modal";
import Button from "@/components/nae-button";
import { KeyRound, Plus } from "lucide-react";

const PasswordSettings = () => {

  const [sendingEmail, setSendingEmail] = useState(false);
  const [showPasswordLinkModal, setShowPasswordLinkModal] = useState(false);

  const { user } = useAuth();

  if (!user) return;

  const hasPassword = user.linkedProviders?.includes('credentials');

  const handleResetPasswordClick = async () => {
    if (sendingEmail || !user) return;
    try {
      await triggerEmail(user.email, "RESET", setSendingEmail);
      toast.success("A Reset password link has been sent to your email.");
    } catch {
      toast.error("Failed to send reset password email");
    }
  }

  const handlePasswordLinkSuccess = () => {
    setShowPasswordLinkModal(false);
    toast.success("Password added successfully");
  }

  return (
    <div className="p-5 flex items-start gap-4">

      {/* Icon */}
      <div className="mt-0.5 p-2 bg-panel-brand rounded-lg">
        <KeyRound className="w-4 h-4 text-foreground-secondary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4">

          {/* Title & Description */}
          <div className="flex-1">
            <p className="text-sm font-medium">Password</p>
            <p className="text-xs text-foreground-secondary mt-0.5">
              {hasPassword 
                ? 'Email and password sign-in is configured.' 
                : 'No password set — you sign in via Google or a passkey.'
              }
            </p>
          </div>

          {/* Add/Change Password Button */}
          <Button 
            size="small"
            variant="tertiary"
            onClick={hasPassword 
              ? handleResetPasswordClick 
              : () => setShowPasswordLinkModal(true)
            }
            disabled={sendingEmail}
          >
            {!hasPassword && <Plus className="w-3 h-3" />}
            {!hasPassword ? 'Add' : 'Change'}
          </Button>
        </div>
      </div>

      {/* Add Password Dialog */}
      <PasswordLinkModal
        open={showPasswordLinkModal}
        onOpenChange={setShowPasswordLinkModal}
        onCancel={() => setShowPasswordLinkModal(false)}
        onSuccess={handlePasswordLinkSuccess}
      />
    </div>
  )
}

export default PasswordSettings