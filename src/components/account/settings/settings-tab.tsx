"use client";

import { useAuth } from "@/context-providers/auth-context-provider";
import PasskeysSettings from "./passkeys-settings";
import GoogleSettings from "./google-settings";
import MFASettings from "./mfa-settings";
import NaeLoader from "@/components/nae-loader";
import PasswordSettings from "./password-settings";

const SettingsTab = () => {

  const { user } = useAuth();

  if (!user) return (
    <div className="flex w-full justify-center">
      <NaeLoader />
      <span className="sr-only">Loading Settings</span>
    </div>
  )

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Sign In Methods</h2>

        {/* Sign In Methods Panel */}
        <div className="panel divide-y divide-panel-highlight">
          <PasswordSettings />
          <PasskeysSettings />
          <GoogleSettings />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>

        {/* Multi-Factor Authentication Panel */}
        <div className="panel p-5">
          <MFASettings />
        </div>
      </div>
    </div>
  )
}

export default SettingsTab