"use client";

import { useAuth } from "@/context-providers/auth-context-provider";
import { Lock } from "lucide-react";
import MFAManagement from "./mfa-management";

const MFASettings = () => {

  const { user } = useAuth();

  if (!user) return;

  return (
    <>
      {!user.mfaEnabled && (
        <div className="flex items-start gap-3 mb-4">

          {/* Icon */}
          <div className="mt-0.5 p-2 bg-panel-brand rounded-lg">
            <Lock className="w-4 h-4 text-foreground-secondary" />
          </div>

          {/* Title & Description */}
          <div>
            <p className="text-sm font-medium">Authenticator App</p>
            <p className="text-xs text-foreground-secondary mt-0.5">
              Require a time-based code from an authenticator app in addition to your password.
            </p>
          </div>
        </div>
      )}
      <div className="mt-2">
        <MFAManagement mfaEnabled={user.mfaEnabled} />
      </div>
    </>
  )
}

export default MFASettings