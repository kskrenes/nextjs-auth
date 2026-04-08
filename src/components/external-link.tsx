import React, { AnchorHTMLAttributes } from 'react';

const ExternalLink: React.FC<AnchorHTMLAttributes<HTMLAnchorElement>> = ({ href, children, ...rest }) => {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="hover:underline hover:text-indigo-400 text-gray-400" 
      {...rest}
    >
      {children}
    </a>
  );
};

export default ExternalLink;
