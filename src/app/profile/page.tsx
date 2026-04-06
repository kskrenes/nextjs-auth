"use client";

import { triggerEmail } from "@/helpers/trigger-email";
import { Loader2, User } from "lucide-react";
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
    avatarUrl: string;
    socialLinks: string[];
  }>({
    name: "",
    company: "",
    website: "",
    avatarUrl: "",
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

      return `${urlObj.host}/${cleanPathname}`;  
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
      avatarUrl: user.avatarUrl || "",
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
    <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] min-h-screen gap-4">
      <div className="pt-22 px-12" >
        
        <div className="bg-slate-900 flex flex-col px-6 py-12 gap-8">
          {/* Avatar */}
          <div className="w-52 h-52 mx-auto bg-pink-600/20 rounded-full flex items-center justify-center text-white/30 text-[10rem]">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-40 h-40" />}
          </div>

          <div className="flex flex-col gap-1 items-center">
            {/* Name */}
            {user && user.name && (<h1 className="text-3xl font-semibold">{user.name}</h1>)}
            {/* Username */}
            <div className="flex items-center gap-2">
              <p className="text-gray-400 text-xl">{user?.username}</p>
              {user?.isAdmin && (
                <span className="rounded-full bg-gradient-to-br from-green-500 to-green-600 px-3 py-1 text-white text-xs font-semibold text-shadow-md">
                  Admin
                </span>
              )}
            </div>
          </div>

          <div className="flex w-full gap-4">
            {/* Edit Button - Always Visible */}
            <Button 
              className="flex-1 px-0"
              onClick={handleEditClick}
              disabled={!user || isEditing}
            >
              Edit Profile
            </Button>

            {/* Verify Button - Conditional */}
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

      <div className="flex flex-col pt-30 py-2 px-4 gap-8">
        {isEditing ? (
          <form 
            className="flex flex-col max-w-md gap-2" 
            onSubmit={handleUpdate} 
          >
            <Input 
              id="name" 
              label="Name"
              placeholder="Name"
              type="text"
              value={editedFields.name}
              onChange={(e) => setEditedFields({ ...editedFields, name: e.target.value })}
            />
            <Input 
              id="company" 
              label="Company"
              placeholder="Company"
              type="text"
              value={editedFields.company}
              onChange={(e) => setEditedFields({ ...editedFields, company: e.target.value })}
            />
            <Input 
              id="website" 
              label="Website"
              placeholder="Website URL"
              type="text"
              value={editedFields.website}
              onChange={(e) => setEditedFields({ ...editedFields, website: e.target.value })}
            />
            {editedFields.socialLinks.map((link, index) => (
              <Input 
                id={`socialLink${index}`} 
                key={`socialLink${index}`}
                label={`Social URL ${index + 1}`}
                placeholder={`Social URL ${index + 1}`}
                type="text"
                value={link}
                onChange={(e) => handleSocialEdit(e.target.value, index)}
              />
            ))}
            <div className="flex gap-4 mt-4 max-w-xs">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isSaving}
              >
                Save
              </Button>
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
        ) : (
          <div className="flex flex-col gap-2">
            {/* Company */}
            {user?.company && (
              <>
                <h2 className="text-lg font-semibold mt-4">Company</h2>
                <div className="flex items-center gap-2">
                  <CompanyIcon />
                  <span>{user?.company}</span>
                </div>
              </>
            )}
            {/* Email */}
            {user?.email && (
              <>
                <h2 className="text-lg font-semibold mt-4">Email</h2>
                <div className="flex items-center gap-2">
                  <EmailIcon />
                  {user.isVerified ? (
                    <a 
                      href={`mailto:${user.email}`}
                      className="hover:underline hover:text-blue-500" 
                    >
                      {user.email}
                    </a>
                  ) : (
                    <span className="flex gap-2">
                      {user.email}
                      <span className="rounded-full bg-gradient-to-br from-red-500 to-red-600 px-3 py-1 text-white text-xs font-semibold text-shadow-md">
                        Unverified
                      </span>
                    </span>
                  )}
                  
                </div>
              </>
            )}
            {/* Website */}
            {user?.website && (
              <>
                <h2 className="text-lg font-semibold mt-4">Website</h2>
                <div className="flex items-center gap-2">
                  <LinkIcon />
                  <a 
                    href={user.website}
                    className="hover:underline hover:text-blue-500" 
                    rel="noopener noreferrer"
                  >
                    {user.website}
                  </a>
                </div>
              </>
            )}
            {/* Social Links */}
            {user?.socialLinks?.some((element) => element.trim() !== "") && (
              <h2 className="text-lg font-semibold mt-4">Social Links</h2>
            )}
            {user?.socialLinks?.map((rawLink, index) => {
              const link = rawLink.trim();
              return link !== '' && (
                <div key={index} className="flex items-center gap-2">
                  {getSocialIcon(link)}
                  <a 
                    href={link}
                    className="hover:underline hover:text-blue-500" 
                    rel="noopener noreferrer"
                  >
                    {getDisplayLink(link)}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfilePage