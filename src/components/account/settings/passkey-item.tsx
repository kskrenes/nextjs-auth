import { PasskeyDTO } from "@/helpers/dto/passkey-dto";
import { PasskeyManagementProps } from "./passkey-management";
import { KeyboardEvent, useState } from "react";
import { formatRelativeTime } from "@/helpers/util/time-utils";
import { useTruncation } from "@/hooks/use-truncation";
import Button from "@/components/nae-button";
import { Pencil, Trash2 } from "lucide-react";

interface PasskeyItemProps {
  pk: PasskeyDTO;
  onUpdate: PasskeyManagementProps["onUpdate"];
  onDelete: PasskeyManagementProps["onDelete"];
}

const PasskeyItem = ({ pk, onUpdate, onDelete }: PasskeyItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingNickname, setEditingNickname] = useState('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { setRef, isTruncated } = useTruncation();

  const startEditPasskey = () => {
    setIsEditing(true);
    setEditingNickname(pk.nickname);
  };

  const saveEditPasskey = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const ok = await onUpdate(pk.id, editingNickname);
      if (ok) setIsEditing(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNicknameKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !submitting) {
      e.preventDefault();
      void saveEditPasskey();
    }
  };

  const getLastUsed = (date: Date | null | undefined): string => {
    if (!date) return 'Unused';
    return formatRelativeTime(new Date(date));
  };

  return (
    <div className="bg-panel-highlight rounded-lg p-3">
      {isEditing ? (
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
            disabled={submitting}
          >
            Save
          </Button>
          <Button 
            onClick={() => setIsEditing(false)} 
            size="small"
            variant="tertiary"
            className="text-xs"
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div>
            <p 
              ref={setRef}
              title={isTruncated ? pk.nickname : undefined}
              className="text-xs font-medium break-all line-clamp-1"
            >
              {pk.nickname}
            </p>
            <p className="text-xs text-foreground-secondary mt-0.5">
              Added {new Date(pk.createdAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-foreground-muted">
              Last used: {getLastUsed(pk.lastUsed)}
            </p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button 
              type="button"
              title="Edit"
              aria-label={`Edit passkey ${pk.nickname}`}
              onClick={startEditPasskey} 
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
  )
}

export default PasskeyItem