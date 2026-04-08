"use client";

import { triggerEmail } from "@/helpers/trigger-email";
import { Loader2, ShieldUser } from "lucide-react";
import React, { useState, type SubmitEvent } from "react";
import Button from "@/components/nae-button";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { 
  BlueSkyIcon, CompanyIcon, EmailIcon, FacebookIcon, 
  InstagramIcon, LinkedInIcon, LinkIcon, MastodonIcon, 
  RedditIcon, TwitchIcon, TwitterIcon, YouTubeIcon 
} from "@/components/profile-icons";
import Input from "@/components/nae-input";
import { getErrorMessage } from "@/helpers/error-message";
import AvatarUpload from "@/components/avatar-upload";
import { defaultTheme } from "@/helpers/themes";
import ExternalLink from "@/components/external-link";
import Badge from "@/components/badge";

const socialSubstrings = ["linkedin", "facebook", "twitter", "x.com", "instagram", "youtube", "reddit", "twitch", "mastodon", "bsky"];
const socialIconsMap: { [key: string]: React.ReactElement } = {
  linkedin: <LinkedInIcon />,
  twitter: <TwitterIcon />,
  "x.com": <TwitterIcon />,
  facebook: <FacebookIcon />,
  instagram: <InstagramIcon />,
  youtube: <YouTubeIcon />,
  reddit: <RedditIcon />,
  twitch: <TwitchIcon />,
  mastodon: <MastodonIcon />,
  bsky: <BlueSkyIcon />,
};

const ProfilePage = () => {

  const [isSendingVerifyEmail, setIsSendingVerifyEmail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedFields, setEditedFields] = useState<{
    name: string;
    company: string;
    website: string;
    avatarId: string;
    socialLinks: string[];
  }>({
    name: "",
    company: "",
    website: "",
    avatarId: "",
    socialLinks: ["", "", "", ""],
  });
  const { user, loading, updateUser } = useAuth();

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-500' />
      </div>
    );
  }

  const handleVerifyEmailClick = async () => {
    if (!user) return;
    if (isSendingVerifyEmail) return;
    try {
      await triggerEmail(user.email, "VERIFY", setIsSendingVerifyEmail);
      toast.success("Verification email sent");
    } catch (error: unknown) {
      toast.error("Failed to send verification email");
    }
  }
  
  const getNormalizedUrl = (input: string): string => {
    const value = input.trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) {
      return value;
    }
    return `https://${value}`;
  };
  
  const handleUpdate = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSaving) return;

    setIsSaving(true);

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
    } finally {
      setIsSaving(false);
    }
  }

  const getDisplayLink = (url: string) => {
    try {
      const urlObj = new URL(url);
      const cleanPathname = urlObj.pathname.replace(/^\/|\/$/g, ''); // remove leading and trailing slashes
      const hostname = urlObj.hostname.toLowerCase();
      const isSupportedSite = socialSubstrings.some(substring => hostname.includes(substring));

      if (isSupportedSite) {
        return cleanPathname || urlObj.host;
      }

      return cleanPathname ? `${urlObj.host}/${cleanPathname}` : urlObj.host;  
    } catch {
      // fallback to raw string if URL is invalid
      return url;
    }
    
  }

  const getSocialIcon = (url: string) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      const supportedSiteMatch = socialSubstrings.find(substring => hostname.includes(substring));
      if (supportedSiteMatch) {
        return socialIconsMap[supportedSiteMatch];
      }
    } catch {
      // fall through to default icon
    }
    
    return <LinkIcon />;
  }

  const handleEditClick = () => {
    if (!user || isEditing) return;
    setEditedFields({
      name: user.name || "",
      company: user.company || "",
      website: user.website || "",
      avatarId: user.avatarId || "",
      socialLinks: [...(user.socialLinks ?? []), "", "", "", ""].slice(0, 4),
    });
    setIsEditing(true);
  }

  const handleSocialEdit = (value: string, index: number) => {
    setEditedFields((prev) => {
      const newSocialLinks = [...prev.socialLinks];
      newSocialLinks[index] = value;
      return { ...prev, socialLinks: newSocialLinks };
    });
  };

  return (
    <div className="pt-24">

      {/* page title */}
      <h1 className="text-2xl font-semibold mb-8">My Profile</h1>

      {/* page layout */}
      <div className="flex gap-8 mb-8">
        
        {/* first column */}
        <div className="w-90 flex-shrink-0">

          {/* profile card */}
          <div 
            className="flex flex-col px-6 py-12 gap-8 rounded-md" 
            style={{ backgroundColor: defaultTheme.panel }}
          >
            {/* avatar */}
            <AvatarUpload />

            {/* name/username group */}
            <div className="flex flex-col gap-1 items-center">
              {/* name */}
              {user && user.name && (<h1 className="text-3xl font-semibold">{user.name}</h1>)}
              {/* username/admin */}
              <div className="flex items-center gap-2">
                <p className="text-gray-400 text-xl">{user?.username}</p>
                {user?.isAdmin && <Badge label="Admin" variant="green" />}
              </div>
            </div>

            {/* button group */}
            <div className="flex w-full gap-4">
              {/* edit button - always visible */}
              <Button 
                className="flex-1 px-0"
                onClick={handleEditClick}
                disabled={!user || isEditing}
              >
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
        <div className="flex-1">

          {isEditing ? (  
            
            // edit profile form

            <div className="flex flex-col gap-8">
              {/* title panel */}
              <div 
                className="px-5 py-3 rounded-md max-w-150 mr-8" 
                style={{ backgroundColor: defaultTheme.panel }}
              >
                <h2 className="text-lg font-semibold">Edit Profile</h2>
              </div>
              <form 
                className="flex flex-col max-w-md gap-8" 
                onSubmit={handleUpdate} 
              >
                {/* general info group */}
                <div className="flex flex-col gap-4">
                  <label className='text-lg font-semibold'>General Info</label>
                  {/* name */}
                  <div className="flex items-center gap-2">
                    <ShieldUser className="w-5 h-5 text-indigo-400 -m-0.5" />
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
                    disabled={isSaving}
                  >
                    Save
                  </Button>
                  {/* cancel button */}
                  <Button 
                    type="button" 
                    className="flex-1" 
                    variant="secondary"
                    disabled={isSaving}
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          ) : (

            // profile info

            <div className="flex flex-col gap-8">
              {/* title panel */}
              <div 
                className="px-5 py-3 rounded-md max-w-150 mr-8" 
                style={{ backgroundColor: defaultTheme.panel }}
              >
                <h2 className="text-lg font-semibold">My Info</h2>
              </div>
              {/* company */}
              {user?.company && (
                <div className="flex flex-col gap-1">
                  <label className="text-lg font-semibold">Company</label>
                  <div className="flex items-center gap-2">
                    <CompanyIcon />
                    <span className="text-gray-400">{user?.company}</span>
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
                      <span className="flex gap-2 text-gray-400">
                        {user.email}
                        <Badge label="Unverified" variant="red" />
                      </span>
                    )}
                  </div>
                </div>
              )}
              {/* website */}
              {user?.website && (
                <div className="flex flex-col gap-1">
                  <label className="text-lg font-semibold">Website</label>
                  <div className="flex items-center gap-2">
                    <LinkIcon />
                    <ExternalLink href={user.website}>{user.website}</ExternalLink>
                  </div>
                </div>
              )}
              {/* social accounts */}
              {user?.socialLinks?.some((element) => element.trim() !== "") && (
                <div className="flex flex-col gap-1">
                  <label className="text-lg font-semibold">Social Accounts</label>
                  {user?.socialLinks?.map((rawLink, index) => {
                    const link = rawLink.trim();
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
        </div>
      </div>
    </div>
  )
}

export default ProfilePage