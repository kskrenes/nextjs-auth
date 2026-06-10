import React, { AnchorHTMLAttributes } from 'react';

const ExternalLink: React.FC<AnchorHTMLAttributes<HTMLAnchorElement>> = ({ href, children, ...rest }) => {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      {...rest}
      className="hover:underline hover:text-brand-light text-foreground-secondary w-full break-all line-clamp-1" 
    >
      {children}
    </a>
  );
};

export default ExternalLink;
