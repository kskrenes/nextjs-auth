"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import Button from "./nae-button";
import QRCode from 'react-qr-code';
import Input from "./nae-input";
import { Check, Copy, ShieldCheck } from "lucide-react";
import { axiosClient } from "@/lib/axios-client";
import toast from "react-hot-toast";
import NaeLoader from "./nae-loader";
import { useAuth } from "@/context-providers/auth-context-provider";

const INIT_ERROR = "Failed to initialize Multi-Factor Authentication";
const VERIFY_ERROR = "Could not verify authentication code";
const CODES_SETUP_TITLE = "Step 3 of 3: Save your backup codes";
const CODES_REGEN_TITLE = "Save your new backup codes";

interface MFAManagementProps {
  mfaEnabled: boolean;
  onRegenBackupCodesClick: (onSuccess: (codes: string[]) => void) => void;
  onDisableConfirmClick: () => void;
  regenCodes?: string[] | null;
}

const MFAManagement = ({ mfaEnabled, onRegenBackupCodesClick, onDisableConfirmClick, regenCodes = null }: MFAManagementProps) => {

  // initialize step dynamically: start at 5 if already enabled, otherwise 1
  const [step, setStep] = useState<number>(mfaEnabled ? 5 : 1);
  const [loading, setLoading] = useState<boolean>(false);
  const [secret, setSecret] = useState<string>('');
  const [uri, setUri] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState<boolean>(false);
  const [confirmDisable, setConfirmDisable] = useState<boolean>(false);
  const [codesTitle, setCodesTitle] = useState<string>(CODES_SETUP_TITLE);

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
      setCodesTitle(CODES_REGEN_TITLE);
      setStep(4);
    }
  }, [regenCodes])
  
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
  }

  const postStep = async (action: () => Promise<void>, errorMessage: string) => {
    try {
      setLoading(true);
      await action();
      advance();
    } catch (error) {
      handleError(errorMessage, error);
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

    await postStep(submitEnableMfa, VERIFY_ERROR);
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  }

  const handleDisableRequest = () => {
    setConfirmDisable(true);
  }

  const handleDisableCancel = () => {
    setConfirmDisable(false);
  }

  const handleDisableConfirm = async () => {
    onDisableConfirmClick();
  }

  const handleRegenCodesSuccess = (codes: string[]) => {
    setBackupCodes(codes);
    setStep(4);
  }

  if (step === 5) {
    return (
      <div className="flex flex-col mt-2 gap-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-success" />
          <span className="font-medium text-success">
            Two-Factor Authentication is enabled
          </span>
        </div>
        <div>
          <Button 
            size="small"
            variant="secondary"
            disabled={loading}
            onClick={() => {onRegenBackupCodesClick(handleRegenCodesSuccess)}}
          >
            Regenerate Backup Codes
          </Button>
        </div>
        {confirmDisable ? (
          <div className="p-3 rounded-md bg-panel text-foreground-secondary">
            <p className="text-error mb-3 font-medium">
              Are you sure you want to disable two-factor authentication? This will make your account less secure.
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
                variant="secondary"
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
              Disable Two-Factor Authentication
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {step === 1 && (
        <div className="flex gap-3 items-center">
          <div>
            <Button 
              size="small"
              onClick={handleEnable}
              disabled={loading}
            >
              Enable Two-Factor Authentication
            </Button>
          </div>
          {loading && <NaeLoader />}
        </div>
      )}
      {step === 2 && (
        <div className="flex flex-col mt-2 gap-5">
          <div className="flex flex-col gap-3">
            <p>Step 1 of 3: Scan this QR code with your authenticator app</p>
            <div className="p-3 w-fit rounded-md bg-[#f3faff]">
              <QRCode 
                value={uri}
                size={256}
                style={{ height: "auto", maxWidth: 150, width: 150 }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="mt-4">Or enter this code manually:</p>
            <div className="p-3 w-fit rounded-md bg-panel text-foreground-secondary">
              {secret}
            </div>
          </div>
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
      {step === 3 && (
        <form className="flex flex-col mt-2 gap-5" onSubmit={handleVerify}>
          <div className="flex flex-col gap-3">
            <p>Step 2 of 3: Enter the verification code from your authenticator app</p>
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
          <div className="flex items-center gap-3">
            <div>
              <Button 
                size="small"
                type="submit"
                disabled={loading || verificationCode.length < 6}
              >
                Verify
              </Button>
            </div>
            {loading && <NaeLoader />}
          </div>
        </form>
      )}
      {step === 4 && (
        <div className="flex flex-col mt-2 gap-5">
          <div className="flex flex-col gap-3">
            <p>{codesTitle}</p>
            <p className="text-foreground-secondary">Store these codes in a safe place. You can use them to access your account if you lose access to your authenticator app.</p>
            <div className="p-5 rounded-md bg-panel flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <p key={`backupcode${index}`}>{code}</p>
                ))}
              </div>
              <div className="mt-1">
                <Button 
                  size="small" 
                  variant="tertiary" 
                  className="gap-2"
                  onClick={copyBackupCodes}
                >
                  {copiedCodes ? (
                    <>
                      <Check className="w-4 h-4 text-success" />
                      <span className="text-success">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Codes</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div>
            <Button 
              size="small"
              disabled={loading}
              onClick={advance}
            >
              I&apos;ve Saved These Codes
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MFAManagement