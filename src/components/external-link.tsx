import React, { AnchorHTMLAttributes } from 'react';

const ExternalLink: React.FC<AnchorHTMLAttributes<HTMLAnchorElement>> = ({ href, children, ...rest }) => {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      {...rest}
      className="hover:underline hover:text-brand-light text-foreground-secondary flex-1 max-w-60 xs:max-w-90 min-w-0 truncate" 
    >
      {children}
    </a>
  );
};

export default ExternalLink;
