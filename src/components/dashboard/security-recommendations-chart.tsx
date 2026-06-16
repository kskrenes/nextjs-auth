import { UserDTO } from "@/helpers/dto/user-dto";
import { Card, Text } from "@tremor/react";
import { ShieldAlert } from "lucide-react";

interface SecurityRecommendationsChartProps {
  user: UserDTO;
}

const SecurityRecommendationsChart = ({ user }: SecurityRecommendationsChartProps) => {
  const hasGoogleProvider = user.linkedProviders.includes('google');
  return (
    <Card className="bg-panel-amber rounded-lg shadow-none ring-0">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-symbol-amber mt-0.5" />
        <div>
          <Text className="text-foreground-amber font-medium mb-2">Security Recommendations</Text>
          <ul className="space-y-1.5 text-sm text-foreground-amber/90">
            {!user.mfaEnabled && <li className="flex items-start gap-2">
              <span className="text-symbol-amber">•</span>
              <span>Enable Multi-Factor Authentication to add an extra layer of security to your account</span>
            </li>}
            {user.passkeyCount === 0 && <li className="flex items-start gap-2">
              <span className="text-symbol-amber">•</span>
              <span>Add a passkey to enable passwordless sign-in with biometrics or a security key — passkeys are phishing-resistant and can&apos;t be stolen in a data breach</span>
            </li>}
            {!user.hasStrongPassword && !hasGoogleProvider && <li className="flex items-start gap-2">
              <span className="text-symbol-amber">•</span>
              <span>Update to a stronger password with at least 12 characters, including uppercase, lowercase, numbers, and symbols</span>
            </li>}
            {!user.isVerified && !hasGoogleProvider && <li className="flex items-start gap-2">
              <span className="text-symbol-amber">•</span>
              <span>Verify your email address to enable password recovery and important security notifications</span>
            </li>}
          </ul>
        </div>
      </div>
    </Card>
  )
}

export default SecurityRecommendationsChart