import { BadgeDelta, Card, Flex, Metric, ProgressBar, Text } from "@tremor/react"
import { CheckCircle2, ShieldAlert, ShieldCheck, XCircle } from "lucide-react"

interface HealthScoreWidgetProps {
  healthChecks: { name: string, enabled: boolean, weight: number }[];
  healthScore: number;
}

const styleMap = {
  icon: {
    excellent: 'p-3 rounded-full bg-panel-excellent text-foreground-excellent',
    good: 'p-3 rounded-full bg-panel-good text-foreground-good',
    fair: 'p-3 rounded-full bg-panel-fair text-foreground-fair',
    poor: 'p-3 rounded-full bg-panel-poor text-foreground-poor',
  },
  text: {
    excellent: 'font-medium text-foreground-excellent!',
    good: 'font-medium text-foreground-good!',
    fair: 'font-medium text-foreground-fair!',
    poor: 'font-medium text-foreground-poor!',
  },
  badge: {
    excellent: 'text-xs ring-0! font-medium text-foreground-excellent!',
    good: 'text-xs ring-0! font-medium text-foreground-good!',
    fair: 'text-xs ring-0! font-medium text-foreground-fair!',
    poor: 'text-xs ring-0! font-medium text-foreground-poor!',
  },
  progress: {
    excellent: 'mt-3 mb-4 [&>div]:bg-excellent/20 [&>div>div]:bg-excellent',
    good: 'mt-3 mb-4 [&>div]:bg-good/20 [&>div>div]:bg-good',
    fair: 'mt-3 mb-4 [&>div]:bg-fair/20 [&>div>div]:bg-fair',
    poor: 'mt-3 mb-4 [&>div]:bg-poor/20 [&>div>div]:bg-poor',
  }
}

const HealthScoreWidget = ({ healthChecks, healthScore }: HealthScoreWidgetProps) => {

  const getHealthStatus = () => {
    if (healthScore >= 90) return { label: 'Excellent', style: 'excellent', icon: ShieldCheck };
    if (healthScore >= 70) return { label: 'Good', style: 'good', icon: ShieldCheck };
    if (healthScore >= 50) return { label: 'Fair', style: 'fair', icon: ShieldAlert };
    return { label: 'Poor', style: 'poor', icon: ShieldAlert };
  };

  const healthStatus = getHealthStatus();
  const HealthIcon = healthStatus.icon;

  const stylename = healthStatus.style as keyof typeof styleMap.icon;

  const healthIconClass = styleMap.icon[stylename];
  const textClass = styleMap.text[stylename];
  const badgeDeltaClass = styleMap.badge[stylename];
  const progressBarClass = styleMap.progress[stylename];

  return (
    <Card className="bg-panel rounded-lg shadow-none ring-0">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Text className="text-foreground-secondary">Security Health Score</Text>
          <Metric className="mt-2">{healthScore}/100</Metric>
        </div>
        <div className={healthIconClass}>
          <HealthIcon />
        </div>
      </div>

      <Flex className="mb-4">
        <Text className={textClass}>{healthStatus.label}</Text>
        <BadgeDelta 
          deltaType={healthScore >= 70 ? 'increase' : 'decrease'} 
          className={badgeDeltaClass}>
          {healthScore}%
        </BadgeDelta>
      </Flex>

      <ProgressBar
        value={healthScore}
        className={progressBarClass}
      />

      <div className="space-y-2 mt-4">
        {healthChecks.map((check, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-t border-panel-highlight">
            <div className="flex items-center gap-2">
              {check.enabled ? (
                <CheckCircle2 className="w-4 h-4 text-excellent" />
              ) : (
                <XCircle className="w-4 h-4 text-poor" />
              )}
              <Text className="text-sm text-foreground-secondary">{check.name}</Text>
            </div>
            <Text className="text-xs text-foreground-muted">+{check.weight} pts</Text>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default HealthScoreWidget