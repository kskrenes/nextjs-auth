"use client";

import { triggerEmail } from "@/helpers/util/email-trigger";
import { ChevronDown, ChevronUp, Fingerprint, KeyRound, Lock, Plus, ShieldAlert } from "lucide-react";
import { useState } from "react";
import Button from "@/components/nae-button";
import toast from "react-hot-toast";
import { useAuth } from "@/context-providers/auth-context-provider";
import { getErrorMessage } from "@/helpers/util/error-utils";
import FullScreenLoader from "@/components/full-screen-loader";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import GoogleLoginButton from "@/components/google-login-button";
import NaeLoader from "@/components/nae-loader";
import DeviceCard from "@/components/device-card";
import { SessionDTO } from "@/helpers/dto/session-dto";
import { SecurityLogDTO } from "@/helpers/dto/security-log-dto";
import SecurityLogCard from "@/components/security-log-card";
import { axiosClient } from "@/lib/axios-client";
import MFAManagement from "@/components/mfa-management";
import MFABackupCodesModal from "@/components/mfa-backup-codes-modal";
import MFADisableModal from "@/components/mfa-disable-modal";
import PasswordLinkModal from "@/components/password-link-modal";
import PasskeyDeleteConfirmModal from "@/components/passkey-delete-confirm-modal";
import GoogleUnlinkConfirmModal from "@/components/google-unlink-confirm-modal";
import PasskeyManagement from "@/components/passkey-management";
import { usePasskeys } from "@/hooks/use-passkeys";
import { PasskeyDTO } from "@/helpers/dto/passkey-dto";
import ProfileTab from "@/components/account/profile-tab";
import ProfilePanel from "@/components/account/profile-panel";

const AccountPage = () => {

  const [showRegenModal, setShowRegenModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showPasswordLinkModal, setShowPasswordLinkModal] = useState(false);
  const [showPasskeyDeleteConfirmModal, setShowPasskeyDeleteConfirmModal] = useState(false);
  const [showGoogleUnlinkConfirmModal, setShowGoogleUnlinkConfirmModal] = useState(false);
  const [regenCodes, setRegenCodes] = useState<string[] | null>(null);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [sessionsList, setSessionsList] = useState<SessionDTO[] | null>(null);
  const [securityLogs, setSecurityLogs] = useState<SecurityLogDTO[] | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingSecurityData, setIsLoadingSecurityData] = useState(false);
  const [isSecurityDataError, setIsSecurityDataError] = useState(false);
  const [securityDataErrorMessage, setSecurityDataErrorMessage] = useState('');
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [passkeysExpanded, setPasskeysExpanded] = useState(false);
  const [deletePasskeyId, setDeletePasskeyId] = useState<string | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeyDTO[]>([]);

  const { 
    user, 
    fetchingUser, 
    updatingUser, 
    registerPasskey, 
    deletePasskey,
    logout
  } = useAuth();

  const { 
    fetchPasskeys,
    updatePasskey,
    error: usePasskeysError, 
    loading: usePasskeysLoading 
  } = usePasskeys();

  if (fetchingUser) return <FullScreenLoader />;

  const handleEditClick = () => {
    if (!user || isEditing) return;
    setActiveTab(0);
    setIsEditing(true);
  }

  const handleProfileEditComplete = () => {
    setIsEditing(false);
  }

  const handleResetPasswordClick = async () => {
    if (isSendingResetEmail || !user) return;
    try {
      await triggerEmail(user.email, "RESET", setIsSendingResetEmail);
      toast.success("A Reset password link has been sent to your email.");
    } catch {
      toast.error("Failed to send reset password email");
    }
  }

  const handleGoogleLinkSuccess = () => {
    toast.success("Google account added successfully!");
  }

  const handleGoogleLinkError = (message: string) => {
    toast.error(message);
  }

  const handlePasskeyError = (err?: unknown) => {
    const message =
    err instanceof Error
      ? err.message
      : (usePasskeysError ?? 'Failed to manage passkey');
    console.error('Passkey operation failed', err ?? usePasskeysError);
    toast.error(message);
  }

  const handlePasskeySuccess = async (success: boolean) => {
    if (success) await fetchSettingsTabData();
    else handlePasskeyError();
    if (passkeys.length === 0) setPasskeysExpanded(false);
  }

  const fetchSettingsTabData = async () => {
    if (usePasskeysLoading) return;

    try {
      const fetchedPasskeys = await fetchPasskeys();
      setPasskeys(fetchedPasskeys);
    }
    catch (err) {
      handlePasskeyError(err);
    }
  }

  const fetchSecurityTabData = async () => {
    if (isLoadingSecurityData) return;

    setIsLoadingSecurityData(true);
    setIsSecurityDataError(false);
    try {
      // fetch sessions and security logs
      const [sessionsResponse, logsResponse] = await Promise.all([
        axiosClient.get("/api/auth/sessions"),
        axiosClient.get("/api/users/security-logs")
      ]);
      setCurrentSessionId(sessionsResponse.data.currentSessionId);
      setSessionsList(sessionsResponse.data.sessions);
      setSecurityLogs(logsResponse.data.securityLogs);
    }
    catch (error) {
      console.error("Failed to load security tab data", error);
      setIsSecurityDataError(true);
      setSecurityDataErrorMessage(getErrorMessage(error, "Failed to load security data"));
    }
    finally {
      setIsLoadingSecurityData(false);
    }
  }

  const handleSignOutAllDevices = async () => {
    if (isRevokingAll) return;

    if (window.confirm("Are you sure you want to sign out all devices? You will be signed out from your current session.")) {
      setIsRevokingAll(true);
      try {
        const response = await axiosClient.post("/api/auth/logout-all");
        const count = response.data.deletedCount;
        toast.success(`Signed out of ${count} device${count > 1 ? 's' : ''}`);
        await logout();
      } catch (error) {
        console.error("Failed to sign out of all devices:", error);
        toast.error("Failed to sign out of all devices");
      } finally {
        setIsRevokingAll(false);
      }
    }
  }

  const handleRegenCodesSuccess = (codes: string[]) => {
    setShowRegenModal(false);
    setRegenCodes(codes);
    toast.success("New backup codes generated successfully");
  }

  const handleDisableSuccess = () => {
    setShowDisableModal(false);
    toast.success("Multi-factor authentication disabled successfully");
  }

  const handleAddPasswordClick = () => {
    setShowPasswordLinkModal(true);
  }

  const handlePasswordLinkSuccess = () => {
    setShowPasswordLinkModal(false);
    toast.success("Password added successfully");
  }

  const handleAddPasskey = async () => {
    if (usePasskeysLoading || updatingUser) return;

    try {
      const registered = await registerPasskey();
      await handlePasskeySuccess(registered);
    }
    catch (err) { 
      handlePasskeyError(err); 
    }
  };

  const handleDeletePasskey = async () => {
    if (usePasskeysLoading || updatingUser || !deletePasskeyId) return;

    try {
      const deleted = await deletePasskey(deletePasskeyId);
      await handlePasskeySuccess(deleted);
    }
    catch (err) { 
      handlePasskeyError(err); 
    }
    finally {
      setDeletePasskeyId(null);
    }
  };

  const handleUpdatePasskey = async (id: string, nickname: string): Promise<boolean> => {
    if (usePasskeysLoading) return false;

    try {
      const updated = await updatePasskey(id, nickname);
      await handlePasskeySuccess(updated);
      return true;
    }
    catch (err) { 
      handlePasskeyError(err);
      return false;
    }
  };

  return (
    <div className="page-container">

      {/* page title */}
      <h1 className="page-title-container page-title">Account Management</h1>

      {/* page layout */}
      <div className="flex gap-8 flex-col ll:flex-row">
        
        {/* first column */}
        <div className="ll:w-90">

          {/* profile card */}
          <ProfilePanel 
            editing={isEditing} 
            onEditClick={handleEditClick} 
          />
        </div>

        {/* second column */}
        <div className="w-full ll:flex-1 mx-auto md:mx-0">

          <TabGroup 
            className="flex flex-col gap-8"
            selectedIndex={activeTab} 
            // Programmatic tab changes (e.g. handleEditClick) bypass onChange,
            // so setIsEditing(false) here won't conflict with setIsEditing(true) there.
            onChange={(index) => {
              setActiveTab(index);
              setIsEditing(false);
              switch (index) {
                case 1: fetchSettingsTabData(); break;
                case 2: fetchSecurityTabData();
              }
            }}
          >
            <TabList className="tab-list panel">
              <Tab className="tab-list-item">
                Profile
              </Tab>
              <Tab className="tab-list-item">
                Settings
              </Tab>
              <Tab className="tab-list-item">
                Security
              </Tab>
            </TabList>
            <TabPanels>

              {/* Profile Tab */}
              <TabPanel>
                <ProfileTab 
                  editing={isEditing} 
                  onComplete={handleProfileEditComplete} 
                />
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel>
                <div className="flex flex-col gap-10">
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold">Sign In Methods</label>
                    <div className="panel divide-y divide-panel-highlight">

                      {/* Password */}
                      <div className="p-5 flex items-start gap-4">
                        <div className="mt-0.5 p-2 bg-panel-brand rounded-lg">
                          <KeyRound className="w-4 h-4 text-foreground-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-sm font-medium">Password</p>
                              <p className="text-xs text-foreground-secondary mt-0.5">
                                {(user && user.linkedProviders?.includes('credentials')) ? 'Email and password sign-in is configured.' : 'No password set — you sign in via Google or a passkey.'}
                              </p>
                            </div>
                            <Button 
                              size="small"
                              variant="tertiary"
                              onClick={(user && user.linkedProviders?.includes('credentials')) ? handleResetPasswordClick : handleAddPasswordClick}
                              disabled={isSendingResetEmail}
                              className="text-sm gap-2"
                            >
                              {(user && user.linkedProviders?.includes('credentials')) ? (
                                'Change'
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" />
                                  Add
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Passkeys */}
                      <div className="flex flex-col">
                        <div className="p-5 flex items-start gap-4">
                          <div className="mt-0.5 p-2 bg-panel-brand rounded-lg">
                            <Fingerprint className="w-4 h-4 text-foreground-secondary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-sm font-medium">Passkeys</p>
                                <p className="text-xs text-foreground-secondary mt-0.5">
                                  {passkeys.length !== 0 ? (
                                    <button
                                      type="button"
                                      className="flex gap-2 hover:text-foreground-primary transition-colors cursor-pointer"
                                      onClick={() => setPasskeysExpanded(!passkeysExpanded)}
                                      aria-expanded={passkeysExpanded}
                                      aria-controls="passkey-list"
                                    >
                                      <span className="text-left">
                                        {passkeys.length} passkey{passkeys.length > 1 ? 's' : ''} configured
                                      </span>
                                      {passkeysExpanded ? <ChevronUp className="w-3 h-3 mt-0.5" /> : <ChevronDown className="w-3 h-3 mt-0.5" />}
                                    </button>
                                  ) : 'Passwordless sign-in with biometrics or security keys.'}
                                </p>
                              </div>
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
                                  className="text-sm gap-2"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Passkey list */}
                        {passkeysExpanded && passkeys.length > 0 && (
                          <PasskeyManagement 
                            passkeys={passkeys} 
                            onUpdate={handleUpdatePasskey} 
                            onDelete={(id) => {
                              setDeletePasskeyId(id);
                              setShowPasskeyDeleteConfirmModal(true);
                            }}
                          />
                        )}
                      </div>

                      {/* Google */}
                      <div className="p-5 flex items-start gap-4">
                        <div className="mt-0.5 p-2 bg-panel-brand rounded-lg">
                          <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                            <g fill="none" fillRule="evenodd">
                              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                              <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z" fill="#34A853"/>
                              <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                              <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                            </g>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-medium">Google</p>
                              <p className="text-xs text-foreground-secondary mt-0.5">
                                {(user && user.linkedProviders?.includes('google')) ? 'Linked to your Google account.' : 'Sign in with your Google account.'}
                              </p>
                            </div>
                            {(user && user.linkedProviders?.includes('google')) ? (
                              <Button
                                onClick={() => setShowGoogleUnlinkConfirmModal(true)}
                                size="small"
                                variant="tertiary"
                                className="text-sm gap-2"
                              >
                                Unlink
                              </Button>
                            ) : (
                              <div className="w-14 flex gap-2 items-center">
                                <Plus className="w-4 h-4" />
                                <GoogleLoginButton 
                                  type="icon" 
                                  size="medium" 
                                  callback={handleGoogleLinkSuccess} 
                                  onLoginError={handleGoogleLinkError}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* enable Multi-Factor Authentication */}
                  {user && (
                    <div className="flex flex-col gap-2">
                      <label className="text-lg font-semibold">Two-Factor Authentication</label>
                      <div className="panel p-5">
                        {!user.mfaEnabled && (
                          <div className="flex items-start gap-3 mb-4">
                            <div className="mt-0.5 p-2 bg-panel-brand rounded-lg">
                              <Lock className="w-4 h-4 text-foreground-secondary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Authenticator App</p>
                              <p className="text-xs text-foreground-secondary mt-0.5">
                                Require a time-based code from an authenticator app in addition to your password.
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="mt-2">
                          <MFAManagement 
                            mfaEnabled={user.mfaEnabled} 
                            onRegenBackupCodesClick={() => setShowRegenModal(true)} 
                            onDisableConfirmClick={() => setShowDisableModal(true)}
                            regenCodes={regenCodes}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                </div>
              </TabPanel>

              {/* Security Tab */}
              <TabPanel>
                {isLoadingSecurityData && !sessionsList && !securityLogs ? (
                  <div 
                    className='flex items-center justify-center mt-20'
                    role='status'
                    aria-live='polite'
                    aria-busy='true'
                  >
                    <NaeLoader className='w-10 h-10' />
                    <span className="sr-only">Loading security data...</span>
                  </div>
                ) : isSecurityDataError ? (
                  <div role="alert" className="flex flex-col items-center gap-4 mt-4 px-4 text-red-500">
                    <ShieldAlert className="w-10 h-10" />
                    <span className="text-center">{securityDataErrorMessage}</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-8">
                    {sessionsList && sessionsList.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1 mb-1">
                          <label className="text-lg font-semibold">My Devices</label>
                          <p className="text-foreground-secondary max-w-md">
                            Manage your active sessions across all devices.
                          </p>
                        </div>
                        {sessionsList.map((session) => (
                          <DeviceCard 
                            key={session.sessionId} 
                            session={session} 
                            isCurrentSession={currentSessionId === session.sessionId} 
                            onSignOut={fetchSecurityTabData}
                          />
                        ))}
                        <div className="mt-2">
                          <Button 
                            size="small"
                            variant="extreme"
                            onClick={handleSignOutAllDevices}
                            disabled={isRevokingAll}
                            className="text-sm"
                          >
                            Sign Out All Devices
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1 mb-1">
                        <label className="text-lg font-semibold">Recent Activity</label>
                        <p className="text-foreground-secondary max-w-md">
                          A log of recent activities on your account.
                        </p>
                      </div>
                      {securityLogs && securityLogs.length > 0 ? (
                        <>
                        {securityLogs.map((log, index) => (
                          <SecurityLogCard 
                            key={new Date(log.createdAt).getTime() + index}
                            securityLog={log}
                          />
                        ))}
                        </>
                      ) : (
                        <p>No recent security activity.</p>
                      )}
                    </div>
                  </div>
                )}
              </TabPanel>
            </TabPanels>
          </TabGroup>          
        </div>
      </div>
      <MFABackupCodesModal 
        open={showRegenModal}
        onOpenChange={setShowRegenModal}
        onCancel={() => setShowRegenModal(false)}
        onSuccess={handleRegenCodesSuccess}
      />
      <MFADisableModal
        open={showDisableModal}
        onOpenChange={setShowDisableModal}
        onCancel={() => setShowDisableModal(false)}
        onSuccess={handleDisableSuccess}
      />
      <PasswordLinkModal
        open={showPasswordLinkModal}
        onOpenChange={setShowPasswordLinkModal}
        onCancel={() => setShowPasswordLinkModal(false)}
        onSuccess={handlePasswordLinkSuccess}
      />
      <PasskeyDeleteConfirmModal 
        open={showPasskeyDeleteConfirmModal}
        onOpenChange={setShowPasskeyDeleteConfirmModal}
        onCancel={() => {
          setDeletePasskeyId(null);
          setShowPasskeyDeleteConfirmModal(false);
        }}
        onConfirm={() => {
          handleDeletePasskey();
          setShowPasskeyDeleteConfirmModal(false);
        }}
      />
      <GoogleUnlinkConfirmModal
        open={showGoogleUnlinkConfirmModal}
        onOpenChange={setShowGoogleUnlinkConfirmModal}
        onCancel={() => setShowGoogleUnlinkConfirmModal(false)}
        onSuccess={() => setShowGoogleUnlinkConfirmModal(false)}
      />
    </div>
  )
}

export default AccountPage