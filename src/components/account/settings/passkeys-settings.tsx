"use client";

import { useAuth } from "@/context-providers/auth-context-provider";
import { PasskeyDTO } from "@/helpers/dto/passkey-dto";
import { usePasskeys } from "@/hooks/use-passkeys";
import { ChevronDown, ChevronUp, Fingerprint, Plus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import PasskeyDeleteConfirmModal from "./passkey-delete-confirm-modal";
import NaeLoader from "@/components/nae-loader";
import Button from "@/components/nae-button";
import PasskeyManagement from "./passkey-management";
import SettingsIcon from "./settings-icon";

const PasskeysSettings = () => {

  const [passkeys, setPasskeys] = useState<PasskeyDTO[]>([]);
  const [deletePasskeyId, setDeletePasskeyId] = useState<string | null>(null);
  const [passkeysExpanded, setPasskeysExpanded] = useState(false);
  const [showPasskeyDeleteConfirmModal, setShowPasskeyDeleteConfirmModal] = useState(false);

  const { 
    user,
    updatingUser, 
    registerPasskey, 
    deletePasskey
  } = useAuth();

  const { 
    fetchPasskeys,
    updatePasskey,
    error: usePasskeysError, 
    loading: usePasskeysLoading 
  } = usePasskeys();

  if (!user) return;
  
  const handlePasskeyError = (fallbackMessage?: string, err?: unknown) => {
    const message =
      err instanceof Error
        ? err.message
        : (usePasskeysError ?? fallbackMessage ?? 'There was a problem managing your passkey');
    toast.error(message);
  }
  
  const getPasskeys = async (): Promise<PasskeyDTO[]> => {
    if (usePasskeysLoading) return passkeys;
    try {
      const fetchedPasskeys = await fetchPasskeys();
      setPasskeys(fetchedPasskeys);
      return fetchedPasskeys;
    }
    catch (err) {
      handlePasskeyError('There was a problem retrieving your passkeys', err);
      return [];
    }
  }

  const handlePasskeySuccess = async (
    success: boolean, 
    errorMessage: string, 
    showFailureToast = true
  ) => {
    if (success) {
      const refreshed = await getPasskeys();
      if (refreshed.length === 0) setPasskeysExpanded(false);
    } else if (showFailureToast) {
      handlePasskeyError(errorMessage);
    }
  }

  const handleAddPasskey = async () => {
    if (usePasskeysLoading || updatingUser) return;
    const errMessage = 'There was a problem adding your passkey';
    try {
      const registered = await registerPasskey();
      await handlePasskeySuccess(registered, errMessage, false);
    }
    catch (err) { 
      handlePasskeyError(errMessage, err); 
    }
  };

  const handleUpdatePasskeyClick = async (id: string, nickname: string): Promise<boolean> => {
    if (usePasskeysLoading) return false;
    const errMessage = 'There was a problem updating your passkey';
    try {
      const updated = await updatePasskey(id, nickname);
      await handlePasskeySuccess(updated, errMessage);
      return true;
    }
    catch (err) { 
      handlePasskeyError(errMessage, err);
      return false;
    }
  };

  const handleDeletePasskeyConfirm = async () => {
    if (usePasskeysLoading || updatingUser || !deletePasskeyId) return;
    const errMessage = 'There was a problem deleting your passkey';
    try {
      const deleted = await deletePasskey(deletePasskeyId);
      await handlePasskeySuccess(deleted, errMessage, false);
    }
    catch (err) { 
      handlePasskeyError(errMessage, err); 
    }
    finally {
      setDeletePasskeyId(null);
    }
  };

  const handleExpandPasskeys = () => {
    setPasskeysExpanded(!passkeysExpanded);
    // if switching from collapsed, load passkeys if not yet loaded
    if (!passkeysExpanded && passkeys.length === 0) {
      getPasskeys();
    }
  }
  
  return (
    <div className="flex flex-col">
      <div className="p-5 flex items-start gap-4">

        {/* Icon */}
        <SettingsIcon icon={Fingerprint} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">

            {/* Title & Description */}
            <div className="flex-1">
              <p className="text-sm font-medium">Passkeys</p>
              <p className="text-xs text-foreground-secondary mt-0.5">
                {user.passkeyCount !== 0 ? (
                  <button
                    type="button"
                    className="flex gap-2 hover:text-foreground-primary transition-colors cursor-pointer"
                    onClick={handleExpandPasskeys}
                    aria-expanded={passkeysExpanded}
                    aria-controls="passkey-list"
                  >
                    <span className="text-left">
                      {user.passkeyCount} passkey{user.passkeyCount > 1 ? 's' : ''} configured
                    </span>
                    {passkeysExpanded 
                      ? <ChevronUp className="w-3 h-3 mt-0.5" /> 
                      : <ChevronDown className="w-3 h-3 mt-0.5" />
                    }
                  </button>
                ) : 'Passwordless sign-in with biometrics or security keys.'}
              </p>
            </div>

            {/* Add Passkey Button/Loader */}
            {usePasskeysLoading || updatingUser ? (
              <>
                <NaeLoader />
                <span className="sr-only">Loading Passkeys</span>
              </>
            ) : (
              <Button 
                size="small"
                variant="tertiary"
                onClick={handleAddPasskey}
                disabled={updatingUser}
              >
                <Plus className="w-3 h-3" />
                Add
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Passkey Disclosure List/Details */}
      {passkeysExpanded && passkeys.length > 0 && (
        <PasskeyManagement 
          passkeys={passkeys} 
          onUpdate={handleUpdatePasskeyClick} 
          onDelete={(id) => {
            setDeletePasskeyId(id);
            setShowPasskeyDeleteConfirmModal(true);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <PasskeyDeleteConfirmModal 
        open={showPasskeyDeleteConfirmModal}
        onOpenChange={setShowPasskeyDeleteConfirmModal}
        onCancel={() => {
          setDeletePasskeyId(null);
          setShowPasskeyDeleteConfirmModal(false);
        }}
        onConfirm={() => {
          handleDeletePasskeyConfirm();
          setShowPasskeyDeleteConfirmModal(false);
        }}
      />
    </div>
  )
}

export default PasskeysSettings