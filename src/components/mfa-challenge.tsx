"use client";

import { SubmitEvent, useEffect, useRef, useState } from "react";
import Input from "./nae-input";
import { useAuth } from "@/context-providers/auth-context-provider";
import Button from "./nae-button";
import { Switch } from "@headlessui/react";
import { ShieldAlert } from "lucide-react";
import NaeLoader from "./nae-loader";

interface MFAChallengeProps {
  onCancel: () => void;
}

const MFAChallenge = ({ onCancel }: MFAChallengeProps) => {

  const [code, setCode] = useState<string>('');
  const [useBackupCode, setUseBackupCode] = useState<boolean>(false);
  const [isInvalid, setIsInvalid] = useState<boolean>(false);
  const [awaitingRedirect, setAwaitingRedirect] = useState<boolean>(false);

  const { verifyingMFA, verifyMFA } = useAuth();

  const codeInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // focus the verification code input
    if (codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, []);

  const handleVerify = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault(); 

    if (verifyingMFA) return;

    setIsInvalid(false);
    try {
      setAwaitingRedirect(true);
      // TODO: normalize code
      await verifyMFA(code);
    } catch (error) {
      // TODO: handle error
      console.error(error);
      setIsInvalid(true);
      setAwaitingRedirect(false);
    }
  }

  const handleCancel = () => {
    onCancel();
  }

  return (
    <form 
      className="flex w-75 flex-col items-center py-2 gap-8" 
      onSubmit={handleVerify}
    >
      {/* title */}
      <h1 className="text-3xl font-bold">Two-Step Verification</h1>

      {/* error message */}
      {isInvalid && (
        <div role="alert" className="flex items-center gap-2 text-error">
          <ShieldAlert className="w-6 h-6" />
          <span>Invalid code</span>
        </div>
      )}

      <div className="w-full">
        <Input 
          id="mfachallengecode" 
          label={useBackupCode ? "Backup Code" : "Verification Code"}
          placeholder={useBackupCode ? "A1B2C3D4" : "000000"}
          ref={codeInputRef}
          maxLength={useBackupCode ? 8 : 6}
          inputMode={useBackupCode ? "text" : "numeric"}
          autoComplete="one-time-code"
          value={code} 
          onChange={(e) => setCode(e.target.value)}
          className="tracking-widest"
        />
      </div>
      <div className="flex gap-4">
        <Button 
          type="submit"
          disabled={verifyingMFA || awaitingRedirect || code.length < (useBackupCode ? 8 : 6)}
        >
          {verifyingMFA || awaitingRedirect 
            ? (
              <>
                <NaeLoader className="mx-2.5" />
                <span className="sr-only">Signing in</span>
              </>
            ) 
            : 'Verify'
          }
        </Button>
        <Button 
          type="button"
          variant="secondary"
          disabled={verifyingMFA || awaitingRedirect}
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
      <div className="flex gap-2">
        <Switch
          checked={useBackupCode}
          onChange={setUseBackupCode}
          className={useBackupCode ? 'switch-on' : 'switch-off'}
        >
          <span className="sr-only">Use backup code</span>
          <span className={useBackupCode ? 'switch-handle-on' : 'switch-handle-off'} />
        </Switch>
        <p>Use a backup code</p>
      </div>
    </form>
  )
}

export default MFAChallenge