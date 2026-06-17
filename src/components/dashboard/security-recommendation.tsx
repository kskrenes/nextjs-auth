import { ReactNode } from "react";

interface SecurityRecommendationProps {
  children: ReactNode;
}

const SecurityRecommendation = ({ children }: SecurityRecommendationProps) => {
  return (
    <li className="flex items-start gap-2">
      <span className="text-symbol-amber">•</span>
      <span>{children}</span>
    </li>
  )
}

export default SecurityRecommendation