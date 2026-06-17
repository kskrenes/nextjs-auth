"use client";

import { formatRelativeTime } from "@/helpers/util/time-utils";
import { Pencil, Trash2 } from "lucide-react";
import { KeyboardEvent, useState } from "react";
import Button from "@/components/nae-button";
import { PasskeyDTO } from "@/helpers/dto/passkey-dto";

interface PasskeyManagementProps {
  passkeys: PasskeyDTO[];
  onUpdate: (id: string, nickname: string) => Promise<boolean>;
  onDelete: (id: string) => void;
}

const PasskeyManagement = ({ passkeys, onUpdate, onDelete }: PasskeyManagementProps) => {

  const [editingPasskeyId, setEditingPasskeyId] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  const startEditPasskey = (pk: PasskeyDTO) => {
    setEditingPasskeyId(pk.id);
    setEditingNickname(pk.nickname);
  };

  const saveEditPasskey = async () => {
    if (!editingPasskeyId) return;
    setSubmitting(true);
    const ok = await onUpdate(editingPasskeyId, editingNickname);
    if (ok) setEditingPasskeyId(null);
    setSubmitting(false);
  };

  const getLastUsed = (date: Date | null | undefined): string => {
    if (!date) return 'Unused';
    return formatRelativeTime(new Date(date));
  }

  const handleNicknameKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveEditPasskey();
  }

  return (
    <div className="-mt-2 ml-17 mr-5 xs:mr-26 mb-4 space-y-2">
      {passkeys.map((pk) => (
        <div key={pk.id} className="bg-panel-highlight rounded-lg p-3">
          {editingPasskeyId === pk.id ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Personal Passkey"
                value={editingNickname}
                onChange={(e) => setEditingNickname(e.target.value)}
                onKeyDown={handleNicknameKeydown}
                disabled={submitting}
                className="input-standard flex-1 text-sm mr-1"
              />
              <Button 
                onClick={saveEditPasskey} 
                size="small"
                className="text-xs"
              >
                Save
              </Button>
              <Button 
                onClick={() => setEditingPasskeyId(null)} 
                size="small"
                variant="tertiary"
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium">{pk.nickname}</p>
                <p className="text-xs text-foreground-secondary mt-0.5">Added {new Date(pk.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-foreground-muted">Last used: {getLastUsed(pk.lastUsed)}</p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button 
                  type="button"
                  title="Edit"
                  aria-label={`Edit passkey ${pk.nickname}`}
                  onClick={() => startEditPasskey(pk)} 
                  className="p-1 text-foreground-secondary hover:text-brand rounded transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button"
                  title="Remove"
                  aria-label={`Delete passkey ${pk.nickname}`}
                  onClick={() => onDelete(pk.id)} 
                  className="p-1 text-foreground-secondary hover:text-foreground-poor rounded transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default PasskeyManagement