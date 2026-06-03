import { AreaChart, Card, Metric, Text } from "@tremor/react"

// mock data
const apiRequestsData = [
  { time: '00:00', requests: 1234 },
  { time: '04:00', requests: 892 },
  { time: '08:00', requests: 2456 },
  { time: '12:00', requests: 3821 },
  { time: '16:00', requests: 3245 },
  { time: '20:00', requests: 2109 },
  { time: '23:59', requests: 1567 },
];

const APIRequestsChart = () => {
  return (
    <Card className="bg-page shadow-none ring-0">
      <Text className="font-medium mb-1 text-foreground-primary">API Requests</Text>
      <Metric className="font-bold">2,456</Metric>
      <Text className="text-foreground-secondary text-sm mb-4">Current hourly rate</Text>
      <AreaChart
        className="h-52 custom-chart"
        data={apiRequestsData}
        index="time"
        categories={['requests']}
        valueFormatter={(value) => `${value.toLocaleString()}`}
        showLegend={false}
        showGridLines={true}
        showAnimation={true}
      />
    </Card>
  )
}

export default APIRequestsChart