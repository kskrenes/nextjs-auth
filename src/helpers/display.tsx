import { 
  BlueSkyIcon, FacebookIcon, InstagramIcon, LinkedInIcon, LinkIcon, 
  MastodonIcon, RedditIcon, TwitchIcon, TwitterIcon, YouTubeIcon 
} from "@/components/profile-icons";

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

const isHostMatch = (hostname: string, domain: string): boolean => 
  hostname === domain || hostname.endsWith(`.${domain}`);

export const getDisplayLink = (url: string) => {
  try {
    const urlObj = new URL(url);
    const cleanPathname = urlObj.pathname.replace(/^\/|\/$/g, ''); // remove leading and trailing slashes
    const hostname = urlObj.hostname.toLowerCase();
    const isSupportedSite = socialSubstrings.some(substring => isHostMatch(hostname, substring));

    if (isSupportedSite) {
      return cleanPathname || urlObj.host;
    }

    return cleanPathname ? `${urlObj.host}/${cleanPathname}` : urlObj.host;  
  } catch {
    // fall through to raw string if URL is invalid
  }

  return url;
}

export const getSocialIcon = (url: string) => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    const supportedSiteMatch = socialSubstrings.find(substring => isHostMatch(hostname, substring));
    if (supportedSiteMatch) {
      return socialIconsMap[supportedSiteMatch];
    }
  } catch {
    // fall through to default icon
  }
  
  return <LinkIcon />;
}