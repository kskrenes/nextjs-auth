"use client";

import { triggerEmail } from "@/helpers/util/email-trigger";
import { ChevronDown, ChevronUp, Fingerprint, KeyRound, Lock, Pencil, Plus, ShieldAlert, ShieldUser } from "lucide-react";
import { useState, type SubmitEvent } from "react";
import Button from "@/components/nae-button";
import toast from "react-hot-toast";
import { useAuth } from "@/context-providers/auth-context-provider";
import { CompanyIcon, EmailIcon, LinkIcon } from "@/components/profile-icons";
import Input from "@/components/nae-input";
import { getErrorMessage } from "@/helpers/util/error-utils";
import AvatarUpload from "@/components/avatar-upload";
import Badge from "@/components/badge";
import FullScreenLoader from "@/components/full-screen-loader";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import GoogleLoginButton from "@/components/google-login-button";
import NaeLoader from "@/components/nae-loader";
import DeviceCard from "@/components/device-card";
import { SessionDTO } from "@/helpers/dto/session-dto";
import { SecurityLogDTO } from "@/helpers/dto/security-log-dto";
import SecurityLogCard from "@/components/security-log-card";
import { axiosClient } from "@/lib/axios-client";
import IconLink from "@/components/icon-link";
import MFAManagement from "@/components/mfa-management";
import MFABackupCodesModal from "@/components/mfa-backup-codes-modal";
import MFADisableModal from "@/components/mfa-disable-modal";
import PasswordLinkModal from "@/components/password-link-modal";
import PasskeyManagement from "@/components/passkey-management";
import PasskeyDeleteConfirmModal from "@/components/passkey-delete-confirm-modal";

interface Passkey {
  id: string;
  nickname: string;
  createdAt: Date;
  lastUsed: Date | null;
}

const AccountPage = () => {

  const [showRegenModal, setShowRegenModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showPasswordLinkModal, setShowPasswordLinkModal] = useState(false);
  const [showPasskeyDeleteConfirmModal, setShowPasskeyDeleteConfirmModal] = useState(false);
  const [regenCodes, setRegenCodes] = useState<string[] | null>(null);
  const [isSendingVerifyEmail, setIsSendingVerifyEmail] = useState(false);
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
  const [editedFields, setEditedFields] = useState<{
    name: string;
    company: string;
    website: string;
    socialLinks: string[];
  }>({
    name: "",
    company: "",
    website: "",
    socialLinks: ["", "", "", ""],
  });

  const [deletePasskeyId, setDeletePasskeyId] = useState<string | null>(null);
  const [passkeys, setPasskeys] = useState<Passkey[]>([
    {
      id: '1',
      nickname: 'MacBook Touch ID',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      lastUsed: new Date(Date.now() - 1000 * 60 * 45),
    },
  ]);

  const { 
    user, 
    fetchingUser, 
    updatingUser, 
    updateUser, 
    logout
  } = useAuth();

  if (fetchingUser) return <FullScreenLoader />;

  const handleVerifyEmailClick = async () => {
    if (isSendingVerifyEmail || !user) return;

    try {
      await triggerEmail(user.email, "VERIFY", setIsSendingVerifyEmail);
      toast.success("Verification email sent");
    } catch {
      toast.error("Failed to send verification email");
    }
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
  
  const getNormalizedUrl = (input: string | undefined): string => {
    if (!input) return "";
    const value = input.trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) {
      return value;
    }
    return `https://${value}`;
  };
  
  const handleUpdateUser = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (updatingUser) return;

    const website = getNormalizedUrl(editedFields.website)
    const socialLinks = editedFields.socialLinks.map(link => getNormalizedUrl(link));
    const updatedUser = {
      ...editedFields, 
      website, 
      socialLinks,
    };

    try {
      await updateUser(updatedUser);
      setIsEditing(false);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update profile"));
    }
  }

  const handleEditClick = () => {
    if (!user || isEditing) return;

    // resetPasswordFormState();
    setEditedFields({
      name: user.name || "",
      company: user.company || "",
      website: user.website || "",
      socialLinks: ([...(user.socialLinks ?? []), "", "", "", ""] as string[]).slice(0, 4),
    });

    setActiveTab(0);
    setIsEditing(true);
  }

  const handleSocialEdit = (value: string, index: number) => {
    setEditedFields((prev) => {
      const newSocialLinks = [...prev.socialLinks];
      newSocialLinks[index] = value;
      return { ...prev, socialLinks: newSocialLinks };
    });
  };

  const handleGoogleLinkSuccess = () => {
    toast.success("Google account added successfully!");
  }

  // const resetPasswordFormState = () => {
  //   setPassword("");
  //   setConfirmPassword("");
  //   clearPasswordValidationState();
  // };

  // const handlePasswordChange = (value: string) => {
  //   setPassword(value);
  //   clearPasswordValidationState();
  // }

  // const handleConfirmPasswordChange = (value: string) => {
  //   setConfirmPassword(value);
  //   clearPasswordValidationState();
  // }

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

  const addPasskey = () => {
    const newKey: Passkey = {
      id: Date.now().toString(),
      nickname: `Passkey ${passkeys.length + 1}`,
      createdAt: new Date(),
      lastUsed: null,
    };
    setPasskeys([...passkeys, newKey]);
    setPasskeysExpanded(true);
  };

  const deletePasskey = () => {
    if (deletePasskeyId) {
      setPasskeys(passkeys.filter((pk) => pk.id !== deletePasskeyId));
      setDeletePasskeyId(null);
    }
  };

  const notYetImplemented = () => {
    toast.error("Feature scheduled for future development")
  }

  return (
    <div className="page-container">

      {/* page title */}
      <h1 className="text-2xl min-w-39 max-w-90 font-semibold md:mx-0 mb-8">My Account</h1>

      {/* page layout */}
      <div className="flex gap-8 flex-col ll:flex-row">
        
        {/* first column */}
        <div className="ll:w-90">

          {/* profile card */}
          <div 
            className="flex flex-col w-full px-6 py-12 gap-8 rounded-md bg-panel mb-6 justify-center min-w-0" 
          >
            {/* avatar */}
            <AvatarUpload />

            {/* name/username group */}
            <div className="flex min-w-0 flex-col gap-1 items-center">
              {/* name */}
              {user && user.name && (
                <div className="flex justify-center items-center max-w-55 xs:max-w-80 gap-2 w-full">
                  <h1 className="text-2xl xs:text-3xl truncate font-semibold wrap-break-word line-clamp-1">{user.name}</h1>
                </div>
              )}
              {/* username/admin */}
              <div className="flex justify-center items-center max-w-55 xs:max-w-80 gap-2 w-full">
                <p className="text-foreground-secondary text-lg xs:text-xl break-all line-clamp-1">{user?.username}</p>
                {/* {user?.isAdmin && <Badge label="Admin" variant="green" />} */}
              </div>
            </div>

            {/* button group */}
            <div className="flex gap-4 justify-center mx-auto w-full max-w-80">
              
              {/* edit button - always visible */}
              <Button 
                className="flex-1 gap-2 px-0"
                onClick={handleEditClick}
                disabled={!user || isEditing}
              >
                <Pencil className="w-5 h-5" />
                Edit Profile
              </Button>
              {/* verify email button - conditional */}
              {user && !user?.isVerified && (
                <Button 
                  className="flex-1 px-0" 
                  variant="secondary"
                  onClick={handleVerifyEmailClick}
                  disabled={isSendingVerifyEmail}
                >
                  Verify Email
                </Button>
              )}
            </div>
          </div>
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
              // resetPasswordFormState();
              if (index === 2) {
                fetchSecurityTabData();
              }
            }}
          >
            <TabList className="tab-list">
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
                {!isEditing ? (

                  // profile info

                  <div className="flex flex-col gap-8 min-w-0">
                    {/* company */}
                    {user?.company && (
                      <div className="flex flex-col gap-1">
                        <label className="text-lg font-semibold">Company</label>
                        <div className="flex items-center gap-2">
                          <CompanyIcon />
                          <span className="w-full wrap-break-word text-foreground-secondary line-clamp-1">{user?.company}</span>
                        </div>
                      </div>
                    )}
                    {/* email */}
                    {user?.email && (
                      <div className="flex flex-col gap-1">
                        <label className="text-lg font-semibold">Email</label>
                        <div className="flex items-center gap-2">
                          {user.isVerified ? (
                            // verified email link
                            <IconLink url={`mailto:${user.email}`} />
                          ) : (
                            // unverified email with badge
                            <>
                              <div className="w-4">
                                <EmailIcon />
                              </div>
                              <div className="flex relative">
                                <span className="w-full break-all text-foreground-secondary line-clamp-1 pr-22">{user.email}</span>
                                <Badge label="Unverified" variant="red" className="absolute right-0" />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    {/* website */}
                    {user?.website && getNormalizedUrl(user.website) && (
                      <div className="flex flex-col gap-1">
                        <label className="text-lg font-semibold">Website</label>
                        <IconLink url={getNormalizedUrl(user.website)} />
                      </div>
                    )}
                    {/* social accounts */}
                    {user?.socialLinks?.some((element) => element && element.trim() !== "") && (
                      <div className="flex flex-col gap-1">
                        <label className="text-lg font-semibold">Social Accounts</label>
                        {user?.socialLinks?.map((rawLink, index) => {
                          const link = getNormalizedUrl(rawLink);
                          return link !== '' && (
                            <IconLink key={index} url={link} />
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (

                  // edit profile form

                  <form 
                    className="flex flex-col max-w-md gap-8" 
                    onSubmit={handleUpdateUser} 
                  >
                    {/* general info group */}
                    <div className="flex flex-col gap-4">
                      <label className='text-lg font-semibold'>General Info</label>
                      {/* name */}
                      <div className="flex items-center gap-2">
                        <ShieldUser className="w-5 h-5 text-brand-light -m-0.5" />
                        <Input 
                          id="name" 
                          placeholder="Name"
                          type="text"
                          aria-label="Name"
                          value={editedFields.name}
                          onChange={(e) => setEditedFields({ ...editedFields, name: e.target.value })}
                        />
                      </div>
                      {/* company */}
                      <div className="flex items-center gap-2">
                        <CompanyIcon />
                        <Input 
                          id="company" 
                          placeholder="Company"
                          type="text"
                          aria-label="Company"
                          value={editedFields.company}
                          onChange={(e) => setEditedFields({ ...editedFields, company: e.target.value })}
                          className="w-full"
                        />
                      </div>
                      {/* website */}
                      <div className="flex items-center gap-2">
                        <LinkIcon />
                        <Input 
                          id="website" 
                          placeholder="Website URL"
                          type="text"
                          aria-label="Website"
                          value={editedFields.website}
                          onChange={(e) => setEditedFields({ ...editedFields, website: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* social accounts */}
                    <div className="flex flex-col gap-4">
                      <label className='text-lg font-semibold'>Social Accounts</label>
                      {editedFields.socialLinks.map((link, index) => (
                        <div key={`socialLink${index}`} className="flex items-center gap-2">
                          <LinkIcon />
                          <Input 
                            id={`socialLink${index}`} 
                            placeholder={`Social URL ${index + 1}`}
                            type="text"
                            aria-label={`Social URL ${index + 1}`}
                            value={link}
                            onChange={(e) => handleSocialEdit(e.target.value, index)}
                          />
                        </div>
                      ))}
                    </div>


                    {/* form button group */}
                    <div className="flex gap-3 w-60">
                      <Button 
                        type="submit"
                        size="small" 
                        className="flex-1 text-sm"
                        disabled={updatingUser}
                      >
                        Save
                      </Button>
                      <Button 
                        size="small" 
                        variant="secondary" 
                        className="flex-1 text-sm"
                        disabled={updatingUser}
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel>
                <div className="flex flex-col gap-10">
                  <div className="flex flex-col gap-2">
                    <label className="text-lg font-semibold">Sign In Methods</label>
                    <div className="bg-panel rounded-md divide-y divide-panel-highlight">

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
                                  {(user && user.linkedProviders?.includes('credentials')) 
                                    ? (
                                      <span 
                                        className="flex gap-2 hover:text-foreground-primary transition-colors cursor-pointer"
                                        onClick={() => setPasskeysExpanded(!passkeysExpanded)}
                                      >
                                        <span>{passkeys.length} passkey{passkeys.length > 1 ? 's' : ''} configured</span>
                                        {passkeysExpanded ? <ChevronUp className="w-3 h-3 mt-0.5" /> : <ChevronDown className="w-3 h-3 mt-0.5" />}
                                      </span>
                                    ) : 'Passwordless sign-in with biometrics or security keys.'
                                  }
                                </p>
                              </div>
                              <Button 
                                size="small"
                                variant="tertiary"
                                onClick={addPasskey}
                                disabled={false}
                                className="text-sm gap-2"
                              >
                                <Plus className="w-3 h-3" />
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Passkey list */}
                        {passkeysExpanded && passkeys.length > 0 && (
                          <PasskeyManagement 
                            passkeys={passkeys} 
                            onUpdate={(keys) => setPasskeys(keys)} 
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
                                onClick={notYetImplemented}
                                size="small"
                                variant="tertiary"
                                className="text-sm gap-2"
                              >
                                Unlink
                              </Button>
                            ) : (
                              <div className="w-14 flex gap-2 items-center">
                                <Plus className="w-4 h-4" />
                                <GoogleLoginButton callback={handleGoogleLinkSuccess} type="icon" size="medium" />
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
                      <div className="bg-panel rounded-md p-5">
                        {!user.mfaEnabled && (
                          <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 bg-panel-brand rounded-lg mt-0.5">
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
          deletePasskey();
          setShowPasskeyDeleteConfirmModal(false);
        }}
      />
    </div>
  )
}

export default AccountPage