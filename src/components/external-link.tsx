import React, { AnchorHTMLAttributes } from 'react';

const ExternalLink: React.FC<AnchorHTMLAttributes<HTMLAnchorElement>> = ({ href, children, ...rest }) => {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      {...rest}
      className="hover:underline hover:text-indigo-400 text-gray-400" 
    >
      {children}
    </a>
  );
};

export default ExternalLink;
