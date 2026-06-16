"use client";

import { useAuth } from "@/context-providers/auth-context-provider";
import { SubmitEvent, useEffect, useState } from "react";
import Badge from "@/components/badge";
import { CompanyIcon, EmailIcon, LinkIcon } from "../../profile-icons";
import IconLink from "../../icon-link";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/helpers/util/error-utils";
import { ShieldUser } from "lucide-react";
import Button from "../../nae-button";
import Input from "../../nae-input";

interface ProfileTabProps {
  editing: boolean;
  onEditComplete: () => void;
}

const ProfileTab = ({ editing, onEditComplete }: ProfileTabProps) => {

  const [pending, setPending] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [socialLinks, setSocialLinks] = useState(['', '', '', ''])

  const { user, updateUser } = useAuth();

  useEffect(() => {
    if (!user || !editing) return;
    setName(user.name || '');
    setWebsite(user.website || '');
    setCompany(user.company || '');
    setSocialLinks(([...(user.socialLinks ?? []), "", "", "", ""] as string[]).slice(0, 4));
  }, [user, editing])

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

    if (pending) return;

    const normalizedWebsite = getNormalizedUrl(website)
    const normalizedSocialLinks = socialLinks.map(link => getNormalizedUrl(link));
    const updatedUser = {
      name,
      company, 
      website: normalizedWebsite, 
      socialLinks: normalizedSocialLinks,
    };

    try {
      setPending(true);
      await updateUser(updatedUser);
      toast.success("Profile updated");
      onEditComplete();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update profile"));
    } finally {
      setPending(false);
    }
  }

  const handleSocialEdit = (value: string, index: number) => {
    setSocialLinks((prev) => {
      const newSocialLinks = [...prev];
      newSocialLinks[index] = value;
      return newSocialLinks;
    });
  };

  return (
    <>
      {!editing ? (

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
                {(user.isVerified || user.linkedProviders.includes('google')) ? (
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
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={company}
                onChange={(e) => setCompany(e.target.value)}
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
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          {/* social accounts */}
          <div className="flex flex-col gap-4">
            <label className='text-lg font-semibold'>Social Accounts</label>
            {socialLinks.map((link, index) => (
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
              disabled={pending}
            >
              Save
            </Button>
            <Button 
              size="small" 
              variant="secondary" 
              className="flex-1 text-sm"
              disabled={pending}
              onClick={onEditComplete}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </>
  )
}

export default ProfileTab