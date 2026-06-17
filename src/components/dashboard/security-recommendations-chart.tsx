import { UserDTO } from "@/helpers/dto/user-dto";
import { Card, Text } from "@tremor/react";
import { ShieldAlert } from "lucide-react";
import SecurityRecommendation from "./security-recommendation";

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
            {!user.mfaEnabled && (
              <SecurityRecommendation>
                Enable Multi-Factor Authentication to add an extra layer of security to your account
              </SecurityRecommendation>
            )}
            {user.passkeyCount === 0 && (
              <SecurityRecommendation>
                Add a passkey to enable passwordless sign-in with biometrics or a security key — passkeys are phishing-resistant and can&apos;t be stolen in a data breach
              </SecurityRecommendation>
            )}
            {!user.hasStrongPassword && !hasGoogleProvider && (
              <SecurityRecommendation>
                Update to a stronger password with at least 12 characters, including uppercase, lowercase, numbers, and symbols
              </SecurityRecommendation>
            )}
            {!user.isVerified && !hasGoogleProvider && (
              <SecurityRecommendation>
                Verify your email address to enable password recovery and important security notifications
              </SecurityRecommendation>
            )}
          </ul>
        </div>
      </div>
    </Card>
  )
}

export default SecurityRecommendationsChart