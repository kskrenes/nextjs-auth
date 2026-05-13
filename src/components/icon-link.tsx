import ExternalLink from "./external-link";
import { BlueSkyIcon, EmailIcon, FacebookIcon, InstagramIcon, LinkedInIcon, LinkIcon, MastodonIcon, RedditIcon, TwitchIcon, TwitterIcon, YouTubeIcon } from "./profile-icons";

const ICON_MAP = {
  linkedin: LinkedInIcon,
  twitter: TwitterIcon,
  x: TwitterIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
  reddit: RedditIcon,
  twitch: TwitchIcon,
  mastodon: MastodonIcon,
  bsky: BlueSkyIcon,
} as const;

type SocialType = keyof typeof ICON_MAP;

const isHostMatch = (hostname: string, domain: string): boolean => {
  const plainHostname = hostname.replace(/^www\./, '').split('.')[0];
  return plainHostname === domain;
}

const getDisplayLink = (url: string) => {
  try {
    const urlObj = new URL(url);
    const cleanPathname = urlObj.pathname.replace(/^\/|\/$/g, ''); // remove leading and trailing slashes

    if (urlObj.protocol === 'mailto:') {
      return cleanPathname;
    }

    const hostname = urlObj.hostname.toLowerCase();
    const isSupportedSite = Object.keys(ICON_MAP).some(substring => isHostMatch(hostname, substring));

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

    const supportedSiteMatch = Object.keys(ICON_MAP).find(substring => isHostMatch(hostname, substring));
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
      {icon}
      <ExternalLink href={url}>{displayLink}</ExternalLink>
    </div>
  );
};

export default IconLink;
