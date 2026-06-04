import { BadgeDelta, BarChart, Card, Flex, Metric, Text } from "@tremor/react"

// mock data
const authData = [
  { time: '00:00', Success: 245, Failed: 12 },
  { time: '04:00', Success: 178, Failed: 8 },
  { time: '08:00', Success: 512, Failed: 23 },
  { time: '12:00', Success: 834, Failed: 45 },
  { time: '16:00', Success: 723, Failed: 31 },
  { time: '20:00', Success: 456, Failed: 19 },
  { time: '23:59', Success: 334, Failed: 15 },
];

const totalAttempts = authData.reduce((sum, d) => sum + d.Success + d.Failed, 0);
const totalSuccess = authData.reduce((sum, d) => sum + d.Success, 0);
const successRate = ((totalSuccess / totalAttempts) * 100).toFixed(1);

const AuthMetricsChart = () => {
  
  return (
    <Card className="bg-page shadow-none ring-0">
      <Text className="font-medium mb-1 text-foreground-primary">Authentication Activity</Text>
      <Flex className="mb-4">
        <div>
          <Metric className="font-bold">{totalAttempts.toLocaleString()}</Metric>
          <Text className="text-foreground-secondary text-sm">Total attempts (24h)</Text>
        </div>
        <BadgeDelta deltaType="increase" className="mt-1 text-sm ring-0! font-medium text-foreground-excellent!">
          {successRate}% success
        </BadgeDelta>
      </Flex>
      <BarChart
        className="h-52 auth-chart"
        data={authData}
        index="time"
        categories={['Success', 'Failed']}
        colors={['emerald', 'red']}
        valueFormatter={(value) => value.toLocaleString()}
        stack={false}
        showAnimation={true}
      />
    </Card>
  )
}

export default AuthMetricsChart