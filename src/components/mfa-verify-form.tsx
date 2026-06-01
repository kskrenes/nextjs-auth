"use client";

import { Switch } from "@headlessui/react";
import { useEffect, useRef, useState } from "react";
import Input from "./nae-input";
import PanelError from "./panel-error";

const TOTP_LENGTH = 6;
const BACKUP_LENGTH = 8;

interface MFAVerifyFormProps {
  onChange: (code: string, disabled: boolean) => void;
  onVerify: () => void;
  loading: boolean | undefined;
  invalid: boolean | undefined;
}

const MFAVerifyForm = ({ onChange, onVerify, loading, invalid }: MFAVerifyFormProps) => {

  const [useBackupCode, setUseBackupCode] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // focus the verification code input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [invalid, useBackupCode]);

  return (
    <>
      {/* Error */}
      {invalid && <PanelError message={useBackupCode ? 'Invalid backup code' : 'Invalid verification code'} />}

      <div className="space-y-2">
        <Input 
          id="verification-input"
          label={useBackupCode ? 'Backup Code' : 'Verification Code'}
          ref={inputRef}
          value={code}
          onChange={(e) => {
            const val = e.target.value;
            const normalizedVal = useBackupCode
              ? val.replace(/[^a-zA-Z0-9]/g, '').slice(0, BACKUP_LENGTH)
              : val.replace(/\D/g, '').slice(0, TOTP_LENGTH);
            setCode(normalizedVal);
            onChange(normalizedVal, useBackupCode ? normalizedVal.length !== BACKUP_LENGTH : normalizedVal.length !== TOTP_LENGTH);
          }}
          placeholder={useBackupCode ? 'XXXXXXXX' : '000000'}
          maxLength={useBackupCode ? BACKUP_LENGTH : TOTP_LENGTH}
          disabled={loading}
          error={invalid}
          onEnter={onVerify}
          className="tracking-widest"
        />
        <p className="text-xs text-foreground-secondary">
          {useBackupCode
            ? `Enter one of your ${BACKUP_LENGTH}-character backup codes.`
            : `Enter the ${TOTP_LENGTH}-digit code from your authenticator app.`}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="use-backup-code"
          checked={useBackupCode}
          onChange={(checked) => {
            setUseBackupCode(checked);
            setCode('');
            onChange('', true);
          }}
          className={useBackupCode ? 'switch-on' : 'switch-off'}
          disabled={loading}
        >
          <span className="sr-only">Use backup code</span>
          <span className={useBackupCode ? 'switch-handle-on' : 'switch-handle-off'} />
        </Switch>
        <label htmlFor="use-backup-code" className="text-primary cursor-pointer select-none text-sm font-medium">
          Use a backup code
        </label>
      </div>
    </>
  )
}

export default MFAVerifyForm