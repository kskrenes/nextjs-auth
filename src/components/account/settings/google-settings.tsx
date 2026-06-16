"use client";

import { useAuth } from "@/context-providers/auth-context-provider";
import Button from "@/components/nae-button";
import { Plus } from "lucide-react";
import GoogleLoginButton from "../../google-login-button";
import { useState } from "react";
import GoogleUnlinkConfirmModal from "./google-unlink-confirm-modal";
import toast from "react-hot-toast";

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
      <div className="mt-0.5 p-2 bg-panel-brand rounded-lg">
        <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" fillRule="evenodd">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z" fill="#34A853"/>
            <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
          </g>
        </svg>
      </div>

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
              className="text-sm gap-2"
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