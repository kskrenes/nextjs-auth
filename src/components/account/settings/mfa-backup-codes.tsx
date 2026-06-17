"use client";

import Button from "@/components/nae-button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface MFABackupCodesProps {
  codes: string[] | null;
  loading: boolean;
  onContinue: () => void;
}

const MFABackupCodes = ({ codes, loading, onContinue }: MFABackupCodesProps) => {

  const [copiedCodes, setCopiedCodes] = useState<boolean>(false);

  const copyBackupCodes = async () => {
    if (!codes) return;
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    } catch {
      // Keep UI in non-copied state and surface an error toast
      toast.error("Unable to copy backup codes to the clipboard");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Backup Codes Panel/Grid */}
      <div className="panel flex flex-col p-4 gap-4">
        <div className="grid grid-cols-2 gap-2 font-mono">
          {codes?.map((code, index) => (
            <p key={`backupcode${index}`}>{code}</p>
          ))}
        </div>

        {/* Copy Button */}
        <div className="mt-1">
          <Button 
            size="small" 
            variant="tertiary" 
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

      {/* Continue Button */}
      <div className="mt-1">
        <Button 
          size="small"
          disabled={loading}
          onClick={onContinue}
        >
          I&apos;ve Saved These Codes
        </Button>
      </div>
    </div>
  )
}

export default MFABackupCodes