"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import Button from "./nae-button";
import QRCode from 'react-qr-code';
import Input from "./nae-input";
import { Check, Copy, ShieldCheck, Unlock } from "lucide-react";
import { axiosClient } from "@/lib/axios-client";
import toast from "react-hot-toast";
import NaeLoader from "./nae-loader";
import { useAuth } from "@/context-providers/auth-context-provider";

const INIT_ERROR = "Failed to initialize Multi-Factor Authentication";
const VERIFY_ERROR = "Could not verify authentication code";

interface MFAManagementProps {
  mfaEnabled: boolean;
  onRegenBackupCodesClick: () => void;
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
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [codeCount, setCodeCount] = useState<number | null>(null);
  const [copiedCodes, setCopiedCodes] = useState<boolean>(false);
  const [confirmDisable, setConfirmDisable] = useState<boolean>(false);
  const [showBackupCodes, setShowBackupCodes] = useState<boolean>(false);

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
    setVerificationCode('');
  }

  const copyBackupCodes = () => {
    if (!backupCodes) return;
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
    setShowBackupCodes(false);
    setConfirmDisable(false);
  }

  if (step === 5) {
    return (
      <div className="flex flex-col mt-2 gap-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-excellent" />
          <span className="font-medium text-excellent">
            Two-Factor Authentication is enabled
          </span>
        </div>

        {/* Backup Codes Section */}
        <div className="bg-panel-highlight rounded-md p-4">
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

            <div>
              <Button
                onClick={onRegenBackupCodesClick}
                size="small"
                className="text-sm"
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
              <div className="p-4 rounded-md bg-panel flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2 font-mono">
                  {backupCodes?.map((code, index) => (
                    <p key={`backupcode${index}`}>{code}</p>
                  ))}
                </div>
                <div className="mt-1">
                  <Button 
                    size="small" 
                    variant="tertiary" 
                    className="gap-2 text-sm"
                    onClick={copyBackupCodes}
                    disabled={loading}
                  >
                    {copiedCodes ? (
                      <>
                        <Check className="w-4 h-4 text-excellent" />
                        <span className="text-excellent">Copied!</span>
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
              <div className="mt-4">
                <Button 
                  size="small"
                  disabled={loading}
                  onClick={() => setShowBackupCodes(false)}
                  className="text-sm"
                >
                  I&apos;ve Saved These Codes
                </Button>
              </div>
            </div>
          )}
        </div>

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
                className="text-sm"
              >
                Yes, Disable MFA
              </Button>
              <Button
                size="small"
                variant="tertiary"
                disabled={loading}
                onClick={handleDisableCancel}
                className="text-sm"
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
              className="text-sm gap-2"
            >
              <Unlock className="w-3.5 h-3.5" />
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
              className="gap-2 text-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              Enable Two-Factor Authentication
            </Button>
          </div>
          {loading && <NaeLoader />}
        </div>
      )}
      {step === 2 && (
        <div className="flex flex-col mt-2 gap-5">
          <div className="flex flex-col gap-5 bg-panel-highlight rounded-md p-4">
            <div className="flex flex-col gap-2">
              <p>Step 1 of 3 - Scan QR Code</p>
              <p className="text-sm text-foreground-secondary">Open your authenticator app and scan the code below.</p>
              <div className="p-3 w-fit rounded-md bg-[#f3faff] mt-2">
                <QRCode 
                  value={uri}
                  size={256}
                  style={{ height: "auto", maxWidth: 150, width: 150 }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-foreground-secondary">Or enter this code manually:</p>
              <div className="p-3 w-fit rounded-md bg-panel text-foreground-secondary">
                {secret}
              </div>
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
          <div className="flex flex-col gap-5 bg-panel-highlight rounded-md p-4">
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
      {step === 4 && (
        <div className="flex flex-col mt-2 gap-5">
          <div className="flex flex-col gap-5 bg-panel-highlight rounded-md p-4">
            <div className="flex flex-col gap-3">
              <p>Step 3 of 3 - Save Backup Codes</p>
              <p className="text-foreground-secondary text-sm">Store these codes somewhere safe. Each can only be used once to access your account if you lose your authenticator.</p>
              <div className="p-4 rounded-md bg-panel flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2 font-mono">
                  {backupCodes?.map((code, index) => (
                    <p key={`backupcode${index}`}>{code}</p>
                  ))}
                </div>
                <div className="mt-1">
                  <Button 
                    size="small" 
                    variant="tertiary" 
                    className="gap-2 text-sm"
                    onClick={copyBackupCodes}
                  >
                    {copiedCodes ? (
                      <>
                        <Check className="w-4 h-4 text-excellent" />
                        <span className="text-excellent">Copied!</span>
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
          </div>
          <div>
            <Button 
              size="small"
              disabled={loading}
              onClick={advance}
              className="text-sm"
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