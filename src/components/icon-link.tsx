import ExternalLink from "./external-link";
import { BlueSkyIcon, EmailIcon, FacebookIcon, InstagramIcon, LinkedInIcon, LinkIcon, MastodonIcon, RedditIcon, TwitchIcon, TwitterIcon, YouTubeIcon } from "./profile-icons";

const ICON_MAP = {
  x: TwitterIcon,
  twitter: TwitterIcon,
  linkedin: LinkedInIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
  reddit: RedditIcon,
  twitch: TwitchIcon,
  mastodon: MastodonIcon,
  bsky: BlueSkyIcon,
} as const;

type SocialType = keyof typeof ICON_MAP;
const recognizedSocials = Object.keys(ICON_MAP) as SocialType[];

const isHostMatch = (hostname: string, domain: string): boolean => {
  const labels = hostname.toLowerCase().split('.');
  // Check all labels except the top level domain (last one)
  return labels.slice(0, -1).includes(domain);
}

const getDisplayLink = (url: string) => {
  try {
    const urlObj = new URL(url);
    const cleanPathname = urlObj.pathname.replace(/^\/|\/$/g, ''); // remove leading and trailing slashes

    if (urlObj.protocol === 'mailto:') {
      return cleanPathname;
    }

    const hostname = urlObj.hostname.toLowerCase();
    const isSupportedSite = recognizedSocials.some(substring => isHostMatch(hostname, substring));

    if (isSupportedSite) {
      return cleanPathname || urlObj.host;
    }

    return cleanPathname ? `${urlObj.host}/${cleanPathname}` : urlObj.host;  
  } catch {
    // fall through to raw string if URL is invalid
  }

  return url;
}

const getSocialIcon = (url: string) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === 'mailto:') {
      return <EmailIcon />;
    }
    
    const hostname = urlObj.hostname.toLowerCase();

    const supportedSiteMatch = recognizedSocials.find(substring => isHostMatch(hostname, substring));
    if (supportedSiteMatch) {
      const Icon = ICON_MAP[supportedSiteMatch as SocialType];
      return <Icon />;
    }
  } catch {
    // fall through to default icon
  }

  return <LinkIcon />;
}

const IconLink = ({ url }: { url: string }) => {
  const icon = getSocialIcon(url);
  const displayLink = getDisplayLink(url);

  return (
    <div className="flex items-center gap-2">
      <div className="w-4">
        {icon}
      </div>
      <ExternalLink href={url}>{displayLink}</ExternalLink>
    </div>
  );
};

export default IconLink;
