"use client";

import { triggerEmail } from "@/helpers/trigger-email";
import { KeyRound, Pencil, RotateCcwKey, ShieldAlert, ShieldUser, UserPlus } from "lucide-react";
import { useState, type SubmitEvent } from "react";
import Button from "@/components/nae-button";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { CompanyIcon, EmailIcon, LinkIcon } from "@/components/profile-icons";
import Input from "@/components/nae-input";
import { getErrorMessage } from "@/helpers/error-message";
import AvatarUpload from "@/components/avatar-upload";
import ExternalLink from "@/components/external-link";
import Badge from "@/components/badge";
import FullScreenLoader from "@/components/full-screen-loader";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import SetPasswordInputs from "@/components/nae-set-password";
import { getValidPassword } from "@/helpers/expression-validation";
import GoogleLoginButton from "@/components/google-login-button";
import { getDisplayLink, getSocialIcon } from "@/helpers/display";
import NaeLoader from "@/components/nae-loader";
import axios from "axios";
import DeviceCard from "@/components/device-card";
import { SessionDTO } from "@/helpers/session-dto";
import { SecurityLogDTO } from "@/helpers/security-log-dto";
import SecurityLogCard from "@/components/security-log-card";
import { useRouter } from "next/navigation";

const AccountPage = () => {

  const [isSendingVerifyEmail, setIsSendingVerifyEmail] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordValidationError, setIsPasswordValidationError] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [sessionsList, setSessionsList] = useState<[SessionDTO] | null>(null);
  const [securityLogs, setSecurityLogs] = useState<[SecurityLogDTO] | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingSecurityData, setIsLoadingSecurityData] = useState(false);
  const [isSecurityDataError, setIsSecurityDataError] = useState(false);
  const [securityDataErrorMessage, setSecurityDataErrorMessage] = useState('');
  const [isRevokingAll, setIsRevokingAll] = useState(false);
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

  const { 
    user, 
    fetchingUser, 
    updatingUser, 
    linkingAccount, 
    updateUser, 
    linkCredentials,
    logout
  } = useAuth();

  const router = useRouter();

  if (fetchingUser) return <FullScreenLoader />;

  const handleVerifyEmailClick = async () => {
    if (isSendingVerifyEmail || !user) return;

    try {
      await triggerEmail(user.email, "VERIFY", setIsSendingVerifyEmail);
      toast.success("Verification email sent");
    } catch (error: unknown) {
      toast.error("Failed to send verification email");
    }
  }

  const handleResetPasswordClick = async () => {
    if (isSendingResetEmail || !user) return;

    try {
      await triggerEmail(user.email, "RESET", setIsSendingResetEmail);
      toast.success("Reset password email sent");
    } catch (error: unknown) {
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

    resetPasswordFormState();
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

  const handleGoogleLinkSuccess = async () => {
    toast.success("Google account added successfully!");
  }

  const clearPasswordValidationState = () => {
    setIsPasswordValidationError(false);
    setPasswordErrorMessage("");
  };

  const resetPasswordFormState = () => {
    setPassword("");
    setConfirmPassword("");
    clearPasswordValidationState();
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    clearPasswordValidationState();
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    clearPasswordValidationState();
  }

  const handleAddPassword = async () => {
    clearPasswordValidationState();

    if (linkingAccount) return;

    let validPassword;
    try {
      validPassword = getValidPassword(password, confirmPassword);
    } catch (error: unknown) {
      setPasswordErrorMessage((error as Error).message);
      setIsPasswordValidationError(true);
      return;
    }
    
    try {
      // add password via auth context
      await linkCredentials(validPassword);
      resetPasswordFormState();
      toast.success("Password added successfully!");
    } 
    catch (error: unknown) {
      console.error(getErrorMessage(error, "Unable to add password"));
      toast.error("There was a problem adding a password to your account")
    }
  }

  const loadSecurityTabData = async () => {
    if (isLoadingSecurityData || isSecurityDataError) return;

    setIsLoadingSecurityData(true);
    try {
      // fetch sessions and security logs
      const [sessionsResponse, logsResponse] = await Promise.all([
        axios.get("/api/auth/sessions"),
        axios.get("/api/users/security-logs")
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

  const handleDeviceSignout = async () => {
    try {
      const sessionsResponse = await axios.get("/api/auth/sessions");
      setSessionsList(sessionsResponse.data.sessions);
    } catch (error) {
      console.error("Failed to update sessions:", error);
      toast.error("Failed to update sessions");
    }
  }

  const handleSignOutAllDevices = async () => {
    if (isRevokingAll) return;

    setIsRevokingAll(true);
    try {
      const response = await axios.post("/api/auth/logout-all");
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

  return (
    <div className="page-container">

      {/* page title */}
      <h1 className="text-2xl min-w-39 max-w-90 font-semibold mx-auto md:mx-0 mb-8">My Account</h1>

      {/* page layout */}
      <div className="flex gap-8 flex-col ll:flex-row">
        
        {/* first column */}
        <div className="xs:w-90 xs:shrink-0 xs:mx-auto md:mx-0">

          {/* profile card */}
          <div 
            className="flex flex-col w-full px-6 py-12 gap-8 rounded-md bg-panel mb-6" 
          >
            {/* avatar */}
            <AvatarUpload />

            {/* name/username group */}
            <div className="flex flex-col gap-1 items-center">
              {/* name */}
              {user && user.name && (<h1 className="text-2xl xs:text-3xl xs:max-w-75 truncate font-semibold">{user.name}</h1>)}
              {/* username/admin */}
              <div className="flex items-center gap-2">
                <p className="text-foreground-secondary text-lg xs:text-xl">{user?.username}</p>
                {user?.isAdmin && <Badge label="Admin" variant="green" />}
              </div>
            </div>

            {/* button group */}
            <div className="flex w-full gap-4">
              {/* edit button - always visible */}
              <Button 
                className="flex-1 px-0 gap-2"
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
        <div className="w-full xs:w-90 ll:flex-1 mx-auto md:mx-0">

          <TabGroup 
            className="flex flex-col gap-8 max-w-150"
            selectedIndex={activeTab} 
            // Programmatic tab changes (e.g. handleEditClick) bypass onChange,
            // so setIsEditing(false) here won't conflict with setIsEditing(true) there.
            onChange={(index) => {
              setActiveTab(index);
              setIsEditing(false);
              resetPasswordFormState();
              if (index === 2) {
                loadSecurityTabData();
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
              <TabPanel>
                {isEditing ? (  
            
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
                    <div className="flex gap-4 max-w-xs">
                      {/* submit button */}
                      <Button 
                        type="submit" 
                        className="flex-1" 
                        disabled={updatingUser}
                      >
                        Save
                      </Button>
                      {/* cancel button */}
                      <Button 
                        type="button" 
                        className="flex-1" 
                        variant="secondary"
                        disabled={updatingUser}
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (

                  // profile info

                  <div className="flex flex-col gap-8">
                    {/* company */}
                    {user?.company && (
                      <div className="flex flex-col gap-1">
                        <label className="text-lg font-semibold">Company</label>
                        <div className="flex items-center gap-2">
                          <CompanyIcon />
                          <span className="text-foreground-secondary">{user?.company}</span>
                        </div>
                      </div>
                    )}
                    {/* email */}
                    {user?.email && (
                      <div className="flex flex-col gap-1">
                        <label className="text-lg font-semibold">Email</label>
                        <div className="flex items-center gap-2">
                          <EmailIcon />
                          {user.isVerified ? (
                            // verified email link
                            <ExternalLink href={`mailto:${user.email}`}>{user.email}</ExternalLink>
                          ) : (
                            // unverified email with badge
                            <span className="flex gap-2 text-foreground-secondary">
                              {user.email}
                              <Badge label="Unverified" variant="red" />
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {/* website */}
                    {user?.website && getNormalizedUrl(user.website) && (
                      <div className="flex flex-col gap-1">
                        <label className="text-lg font-semibold">Website</label>
                        <div className="flex items-center gap-2">
                          <LinkIcon />
                          <ExternalLink href={getNormalizedUrl(user.website)}>
                            {getDisplayLink(getNormalizedUrl(user.website))}
                          </ExternalLink>
                        </div>
                      </div>
                    )}
                    {/* social accounts */}
                    {user?.socialLinks?.some((element) => element && element.trim() !== "") && (
                      <div className="flex flex-col gap-1">
                        <label className="text-lg font-semibold">Social Accounts</label>
                        {user?.socialLinks?.map((rawLink, index) => {
                          const link = getNormalizedUrl(rawLink);
                          return link !== '' && (
                            <div key={index} className="flex items-center gap-2">
                              {getSocialIcon(link)}
                              <ExternalLink href={link}>{getDisplayLink(link)}</ExternalLink>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </TabPanel>
              <TabPanel>
                <div className="flex flex-col gap-10">

                  {/* reset password */}
                  {user && user.linkedProviders?.includes('credentials') && (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <RotateCcwKey className="w-5 h-5 text-brand-light -m-0.5" />
                        <label className="text-lg font-semibold">Reset Password</label>
                      </div>
                      <p className="text-foreground-secondary max-w-md">
                        We'll send you an email with instructions to update your password.
                      </p>
                      <div className="mt-2">
                        <Button 
                          size="small"
                          onClick={handleResetPasswordClick}
                          disabled={isSendingResetEmail}
                        >
                          Send Reset Email
                        </Button>
                      </div>
                    </div>
                  )}
                  

                  {/* add linked account - password */}
                  {user && !user.linkedProviders?.includes('credentials') && (
                    <div className="flex flex-col gap-1 max-w-md">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-brand-light -m-0.5" />
                        <label className="text-lg font-semibold">Create Password</label>
                      </div>
                      <p className="text-foreground-secondary max-w-md">
                        Set a password to enable traditional email and password login alongside Google SSO.
                      </p>
                      <div className="flex flex-col gap-4 max-w-sm">
                        {isPasswordValidationError && (
                          <div role="alert" className="flex items-center space-x-2 mt-4 text-sm text-red-500">
                            <ShieldAlert className="w-4 h-4" />
                            <span className="text-center">{passwordErrorMessage}</span>
                          </div>
                        )}
                        <SetPasswordInputs
                          label="Password"
                          password={password}
                          confirmPassword={confirmPassword}
                          onPasswordChange={handlePasswordChange}
                          onConfirmPasswordChange={handleConfirmPasswordChange}
                        />
                        <div className="mt-0.5">
                          <Button 
                            size="small"
                            onClick={handleAddPassword}
                            disabled={
                              linkingAccount ||
                              password.length === 0 || 
                              confirmPassword.length === 0
                            }
                          >
                            Add Password
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* add linked account - google */}
                  {user && !user.linkedProviders?.includes('google') && (
                    <div className="flex flex-col gap-1 max-w-md">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-brand-light -m-0.5" />
                        <label className="text-lg font-semibold">Link Google Account</label>
                      </div>
                      <p className="text-foreground-secondary">
                        Connect your Google account to sign in securely with one click. You can still use your current username and password.
                      </p>
                      <div className="mt-2">
                        <GoogleLoginButton callback={handleGoogleLinkSuccess} />
                      </div>
                    </div>
                  )}
                  
                </div>
              </TabPanel>
              <TabPanel>
                {isLoadingSecurityData ? (
                  <div 
                    className='flex items-center justify-center mt-20'
                    role='status'
                    aria-live='polite'
                    aria-busy='true'
                  >
                    <NaeLoader className='w-10 h-10' />
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
                            onSignOut={handleDeviceSignout}
                          />
                        ))}
                        <div className="mt-2">
                          <Button 
                            onClick={handleSignOutAllDevices}
                            disabled={isRevokingAll}
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
    </div>
  )
}

export default AccountPage