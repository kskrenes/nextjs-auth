import { AreaChart, Card, Metric, Text } from "@tremor/react"

// mock data
const cacheHitRateData = [
  { time: '00:00', 'Hit Rate': 94.2 },
  { time: '04:00', 'Hit Rate': 95.8 },
  { time: '08:00', 'Hit Rate': 92.1 },
  { time: '12:00', 'Hit Rate': 89.5 },
  { time: '16:00', 'Hit Rate': 91.3 },
  { time: '20:00', 'Hit Rate': 93.7 },
  { time: '23:59', 'Hit Rate': 94.9 },
];

const CacheHitRateChart = () => {

  const avgHitRate = cacheHitRateData.length > 0
    ? (cacheHitRateData.reduce((sum, d) => sum + d['Hit Rate'], 0) / cacheHitRateData.length).toFixed(1)
    : '0.0';

  return (
    <Card className="bg-page shadow-none ring-0">
      <Text className="font-medium mb-1 text-foreground-primary">Session Cache Hit Rate (Redis)</Text>
      <Metric className="font-bold">{avgHitRate}%</Metric>
      <Text className="text-foreground-secondary text-sm mb-4">Average cache efficiency</Text>
      <AreaChart
        className="h-52 area-chart"
        data={cacheHitRateData}
        index="time"
        categories={['Hit Rate']}
        colors={['emerald']}
        valueFormatter={(value) => `${value.toFixed(1)}%`}
        showLegend={false}
        showGridLines={true}
        showAnimation={true}
        minValue={85}
        maxValue={100}
      />
    </Card>
  )
}

export default CacheHitRateChart