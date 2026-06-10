"use client";

import { formatRelativeTime } from "@/helpers/util/time-utils";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import Button from "./nae-button";

interface Passkey {
  id: string;
  nickname: string;
  createdAt: Date;
  lastUsed: Date | null;
}

interface PasskeyManagementProps {
  passkeys: Passkey[];
  onUpdate: (passkeys: Passkey[]) => void;
  onDelete: (id: string) => void;
}

const PasskeyManagement = ({ passkeys, onUpdate, onDelete }: PasskeyManagementProps) => {

  const [editingPasskeyId, setEditingPasskeyId] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState('');
  
  const startEditPasskey = (pk: Passkey) => {
    setEditingPasskeyId(pk.id);
    setEditingNickname(pk.nickname);
  };

  const saveEditPasskey = () => {
    onUpdate(passkeys.map((pk) => pk.id === editingPasskeyId ? { ...pk, nickname: editingNickname } : pk));
    setEditingPasskeyId(null);
  };

  const getLastUsed = (date: Date | null): string => {
    if (!date) return 'Unused';
    return formatRelativeTime(date);
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
                value={editingNickname}
                onChange={(e) => setEditingNickname(e.target.value)}
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
                <p className="text-xs text-foreground-secondary mt-0.5">Added {pk.createdAt.toLocaleDateString()}</p>
                <p className="text-xs text-foreground-muted">Last used: {getLastUsed(pk.lastUsed)}</p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button 
                  type="button"
                  aria-label={`Edit passkey ${pk.nickname}`}
                  onClick={() => startEditPasskey(pk)} 
                  className="p-1 text-foreground-secondary hover:text-foreground-primary rounded transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button"
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