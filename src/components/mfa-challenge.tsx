"use client";

import { useState } from "react";
import { useAuth } from "@/context-providers/auth-context-provider";
import axios from "axios";
import toast from "react-hot-toast";
import MFAVerifyForm from "./mfa-verify-form";
import MFAVerifyControls from "./mfa-verify-controls";
import PanelHeader from "./panel-header";

interface MFAChallengeProps {
  onCancel: () => void;
}

const MFAChallenge = ({ onCancel }: MFAChallengeProps) => {

  const [code, setCode] = useState<string>('');
  const [disabled, setDisabled] = useState<boolean>(true);
  const [invalid, setInvalid] = useState<boolean>(false);
  const [awaitingRedirect, setAwaitingRedirect] = useState<boolean>(false);

  const { verifyingMFA, verifyMFA } = useAuth();

  const handleFormChange = (val: string, disabled: boolean) => {
    setCode(val);
    setDisabled(disabled);
    setInvalid(false);
  }

  const handleVerify = async () => {
    if (verifyingMFA || awaitingRedirect || disabled || !code) return;

    try {
      setInvalid(false);
      setAwaitingRedirect(true);
      await verifyMFA(code);
    } catch (error) {
      if (axios.isAxiosError(error) && [400, 401].includes(error.response?.status ?? 0)) {
        setInvalid(true);
      } else {
        toast.error("There was an error validating the verification code");
      }
      setAwaitingRedirect(false);
    }
  }

  const handleCancel = () => {
    onCancel();
  }

  return (
    <>
      <PanelHeader 
        title="Two-Factor Authentication" 
        description="Enter your verification code to continue"
      />
      <div className="space-y-5">
        <MFAVerifyForm 
          onChange={handleFormChange}
          onVerify={handleVerify}
          loading={verifyingMFA || awaitingRedirect}
          invalid={invalid}
        />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <MFAVerifyControls 
            onCancel={handleCancel}
            onVerify={handleVerify}
            loading={verifyingMFA || awaitingRedirect} 
            disabled={disabled || verifyingMFA || awaitingRedirect}
          />
        </div>
      </div>
    </>
  )
}

export default MFAChallenge