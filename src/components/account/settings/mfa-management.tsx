"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import Button from "@/components/nae-button";
import QRCode from 'react-qr-code';
import Input from "@/components/nae-input";
import { ShieldCheck, Unlock } from "lucide-react";
import { axiosClient } from "@/lib/axios-client";
import toast from "react-hot-toast";
import NaeLoader from "@/components/nae-loader";
import { useAuth } from "@/context-providers/auth-context-provider";
import MFABackupCodesModal from "./mfa-backup-codes-modal";
import MFADisableModal from "./mfa-disable-modal";
import MFABackupCodes from "./mfa-backup-codes";

const INIT_ERROR = "Failed to initialize Multi-Factor Authentication";
const VERIFY_ERROR = "Could not verify authentication code";

interface MFAManagementProps {
  mfaEnabled: boolean;
}

const MFAManagement = ({ mfaEnabled }: MFAManagementProps) => {

  // initialize step dynamically: start at 5 if already enabled, otherwise 1
  const [step, setStep] = useState<number>(mfaEnabled ? 5 : 1);
  const [loading, setLoading] = useState<boolean>(false);
  const [secret, setSecret] = useState<string>('');
  const [uri, setUri] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [regenCodes, setRegenCodes] = useState<string[] | null>(null);
  const [codeCount, setCodeCount] = useState<number | null>(null);
  const [confirmDisable, setConfirmDisable] = useState<boolean>(false);
  const [showBackupCodes, setShowBackupCodes] = useState<boolean>(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [showDisableMFAModal, setShowDisableMFAModal] = useState(false);

  const { enableMFA } = useAuth();

  // reset to step 1 when MFA is disabled, but allow 
  // step 4 (backup codes) to display after MFA is enabled
  useEffect(() => {
    if (!mfaEnabled) {
      setStep(1);
    }
  }, [mfaEnabled]);

  const codeInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // focus the verification code input on transition to step 3
    if (step === 3 && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [step]);

  useEffect(() => {
    if (regenCodes) {
      setBackupCodes(regenCodes);
      setCodeCount(regenCodes.length);
      setShowBackupCodes(true);
    }
  }, [regenCodes])

  useEffect(() => {
    if (mfaEnabled && !backupCodes && codeCount === null) {
      const fetchCount = async () => {
        try {
          setLoading(true);
          const res = await axiosClient.get('/api/users/mfa/backup-codes');
          setCodeCount(res.data.count);
        } catch {
          toast.error("Failed to retrieve backup code count");
        } finally {
          setLoading(false);
        }
      }
      fetchCount();
    }
  }, [mfaEnabled, backupCodes, codeCount])
  
  const advance = () => {
    setStep((prev) => prev + 1)
  }

  const handleError = (message: string, error: unknown) => {
    console.error(message, error);
    toast.error(message);
  }

  const initializeMfaSetup = async () => {
    const res = await axiosClient.post('/api/users/mfa/setup');;
    setSecret(res.data.totpSecret);
    setUri(res.data.totpUri);
  }

  const submitEnableMfa = async () => {
    const normalizedCode = verificationCode.replace(/\D/g, "").slice(0, 6);
    const codes = await enableMFA(normalizedCode);
    setBackupCodes(codes);
    setCodeCount(codes.length);
  }

  const postStep = async (action: () => Promise<void>, errorMessage: string): Promise<boolean> => {
    try {
      setLoading(true);
      await action();
      advance();
      return true;
    } catch (error) {
      handleError(errorMessage, error);
      return false;
    } finally {
      setLoading(false);
    }
  }

  const handleEnable = async () => {
    await postStep(initializeMfaSetup, INIT_ERROR);
  }

  const handleVerify = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault(); 

    const ok = await postStep(submitEnableMfa, VERIFY_ERROR);
    if (ok) setVerificationCode('');
  }

  const handleDisableRequest = () => {
    setConfirmDisable(true);
  }

  const handleDisableCancel = () => {
    setConfirmDisable(false);
  }

  const handleDisableConfirm = async () => {
    setShowDisableMFAModal(true);
    setShowBackupCodes(false);
    setConfirmDisable(false);
  }

  const handleRegenCodesSuccess = (codes: string[]) => {
    setShowRegenModal(false);
    setRegenCodes(codes);
    toast.success("New backup codes generated successfully");
  }

  const handleDisableMFASuccess = () => {
    setShowDisableMFAModal(false);
    toast.success("Multi-factor authentication disabled successfully");
  }

  // Step 5: MFA Is Enabled
  if (step === 5) {
    return (
      <div className="flex flex-col mt-2 gap-6">

        {/* Enabled Message */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-excellent" />
          <span className="font-medium text-excellent">
            Two-Factor Authentication is enabled
          </span>
        </div>

        {/* Backup Codes Section */}
        <div className="panel-interior p-4">
          <div className="flex justify-between">
            <div className="flex">
              <div className="flex flex-col">
                <h4 className="text-base font-semibold">Backup Codes</h4>
                {loading ? (
                  <NaeLoader />
                ) : codeCount !== null ? (
                  <p className="text-foreground-secondary text-sm">
                    You have <span className="font-medium text-foreground-primary">{codeCount} of 10</span> backup codes remaining.
                  </p>
                ) : (
                  <p className="text-foreground-secondary text-sm">
                    Backup code count is temporarily unavailable.
                  </p>
                )}
                <p className="text-foreground-secondary text-xs mt-2">
                  Single-use codes to access your account if you lose your authenticator app.
                </p>
              </div>
            </div>

            {/* Regen Codes Button */}
            <div>
              <Button
                onClick={() => setShowRegenModal(true)}
                size="small"
              >
                Regenerate
              </Button>
            </div>
          </div>

          {/* Show newly generated codes */}
          {showBackupCodes && (
            <div className="mt-4 pt-4 border-t border-panel">
              <p className="font-medium">Your New Backup Codes</p>
              <p className="text-sm text-foreground-secondary mb-3">
                Save these codes in a safe place. They won&apos;t be shown again.
              </p>
              <MFABackupCodes 
                codes={backupCodes} 
                loading={loading} 
                onContinue={() => setShowBackupCodes(false)} 
              />
            </div>
          )}
        </div>

        {/* Disable MFA Confirmation */}
        {confirmDisable ? (
          <div>
            <p className="text-foreground-poor mb-3 font-medium">
              Disabling 2FA will make your account less secure. Are you sure?
            </p>
            <div className="flex gap-2">
              <Button
                size="small"
                variant="extreme"
                onClick={handleDisableConfirm}
                disabled={loading}
              >
                Yes, Disable MFA
              </Button>
              <Button
                size="small"
                variant="tertiary"
                disabled={loading}
                onClick={handleDisableCancel}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Button 
              size="small"
              variant="warning"
              disabled={loading}
              onClick={handleDisableRequest}
            >
              <Unlock className="w-3.5 h-3.5" />
              Disable Two-Factor Authentication
            </Button>
          </div>
        )}

        {/* Renerate Codes Dialog */}
        <MFABackupCodesModal 
          open={showRegenModal}
          onOpenChange={setShowRegenModal}
          onCancel={() => setShowRegenModal(false)}
          onSuccess={handleRegenCodesSuccess}
        />

        {/* Disable MFA Dialog */}
        <MFADisableModal
          open={showDisableMFAModal}
          onOpenChange={setShowDisableMFAModal}
          onCancel={() => setShowDisableMFAModal(false)}
          onSuccess={handleDisableMFASuccess}
        />
      </div>
    );
  }

  return (
    <div>

      {/* Step 1: Kickoff Enable MFA Flow */}
      {step === 1 && (
        <div className="flex gap-3 items-center">
          <div>
            <Button 
              size="small"
              onClick={handleEnable}
              disabled={loading}
            >
              <ShieldCheck className="w-4 h-4" />
              Enable Two-Factor Authentication
            </Button>
          </div>
          {loading && <NaeLoader />}
        </div>
      )}

      {/* Step 2: Scan QR Code */}
      {step === 2 && (
        <div className="flex flex-col mt-2 gap-5">
          <div className="panel-interior flex flex-col gap-5 p-4">
            <div className="flex flex-col gap-2">
              <p>Step 1 of 3 - Scan QR Code</p>
              <p className="text-sm text-foreground-secondary">Open your authenticator app and scan the code below.</p>

              {/* QR Code */}
              <div className="p-3 w-fit rounded-md bg-[#f3faff] mt-2">
                <QRCode 
                  value={uri}
                  size={256}
                  style={{ height: "auto", maxWidth: 150, width: 150 }}
                />
              </div>

            </div>
            <div className="flex flex-col gap-2">

              {/* Manual Entry Code */}
              <p className="text-xs text-foreground-secondary">Or enter this code manually:</p>
              <div className="panel p-3 w-fit text-foreground-secondary">
                {secret}
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div>
            <Button 
              size="small"
              onClick={advance}
              disabled={loading}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Verification */}
      {step === 3 && (
        <form className="flex flex-col mt-2 gap-5" onSubmit={handleVerify}>
          <div className="panel-interior flex flex-col gap-5 p-4">
            <div className="flex flex-col gap-3">
              <p>Step 2 of 3 - Verify Code</p>
              <p className="text-sm text-foreground-secondary">Enter the 6-digit code shown in your authenticator app.</p>
              <div className="max-w-50">
                <Input 
                  id="vc" 
                  label="" 
                  placeholder="000000"
                  ref={codeInputRef}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={verificationCode} 
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="tracking-widest"
                />
              </div>
            </div>
          </div>

          {/* Verify & Continue Button */}
          <div>
            <Button 
              size="small"
              type="submit"
              disabled={loading || verificationCode.length < 6}
            >
              {loading ? (
                <>
                  <NaeLoader />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Step 4: Save Backup Codes */}
      {step === 4 && (
        <div className="flex flex-col mt-2 gap-5">
          <div className="panel-interior flex flex-col gap-5 p-4">
            <div className="flex flex-col gap-3">
              <p>Step 3 of 3 - Save Backup Codes</p>
              <p className="text-foreground-secondary text-sm">
                Store these codes somewhere safe. Each can only be used once to access your account if you lose your authenticator.
              </p>
              <MFABackupCodes 
                codes={backupCodes} 
                loading={loading} 
                onContinue={advance} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MFAManagement