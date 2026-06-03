"use client";

import FullScreenLoader from "@/components/full-screen-loader";
import { useAuth } from "@/context-providers/auth-context-provider";
import HealthScoreWidget from '@/components/dashboard/health-score-widget';
import APIRequestsChart from "@/components/dashboard/api-requests-chart";

const DashboardPage = () => {

  const { user, fetchingUser } = useAuth();

  if (fetchingUser || !user) return <FullScreenLoader />;

  return (
    <div className="page-container">

      {/* page title */}
      <div className="min-w-39 max-w-90 mx-auto md:mx-0 mb-8">
        <h1 className="text-2xl font-semibold">Security & Operations Dashboard</h1>
        <p className="text-sm text-foreground-secondary mt-1">Monitor your account security and system metrics</p>
      </div>

      {/* Security Health Score */}
      <HealthScoreWidget hasMFA={user.mfaEnabled} hasStrongPassword={user.hasStrongPassword} hasVerifiedEmail={user.isVerified} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
        {/* API Requests */}
        <APIRequestsChart />

        {/* Cache Hit Rate */}
        {/* <Card>
          <Text className="text-gray-700 font-medium mb-1">Session Cache Hit Rate (Redis)</Text>
          <Metric className="text-gray-900">92.3%</Metric>
          <Text className="text-gray-500 text-sm mb-4">Average cache efficiency</Text>
          <AreaChart
            className="h-52"
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
        </Card> */}

        {/* Auth Success vs Failures */}
        {/* <Card>
          <Text className="text-gray-700 font-medium mb-1">Authentication Activity</Text>
          <Flex className="mb-4">
            <div>
              <Metric className="text-gray-900">3,282</Metric>
              <Text className="text-gray-500 text-sm">Total attempts (24h)</Text>
            </div>
            <BadgeDelta deltaType="increase" className="mt-1">
              95.3% success
            </BadgeDelta>
          </Flex>
          <BarChart
            className="h-52"
            data={authData}
            index="time"
            categories={['Success', 'Failed']}
            colors={['emerald', 'red']}
            valueFormatter={(value) => value.toLocaleString()}
            stack={false}
            showAnimation={true}
          />
        </Card> */}

        {/* Allowed Email Domains */}
        {/* <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <Text className="text-gray-700 font-medium">Allowed Email Domains</Text>
              <Text className="text-gray-500 text-sm mt-1">
                Only users with these domains can sign up
              </Text>
            </div>
          </div>

          <List className="mt-4">
            {allowedDomains.map((domain, index) => (
              <ListItem key={index} className="py-3">
                <Flex>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <Bold className="text-gray-900 font-mono text-sm">@{domain}</Bold>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </Flex>
              </ListItem>
            ))}
          </List>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <Text className="text-xs text-gray-500">
              <span className="font-medium">{allowedDomains.length}</span> domains configured
            </Text>
          </div>
        </Card> */}
      </div>

      {/* Security Recommendations */}
      {/* {healthScore < 100 && (
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <Text className="text-amber-900 font-medium mb-2">Security Recommendations</Text>
              <ul className="space-y-1.5 text-sm text-amber-800">
                {!hasMFA && <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  <span>Enable Multi-Factor Authentication to add an extra layer of security to your account</span>
                </li>}
                {!hasStrongPassword && <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  <span>Update to a stronger password with at least 12 characters, including uppercase, lowercase, numbers, and symbols</span>
                </li>}
                {!hasVerifiedEmail && <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  <span>Verify your email address to enable password recovery and important security notifications</span>
                </li>}
              </ul>
            </div>
          </div>
        </Card>
      )} */}
    </div>
  );
}

export default DashboardPage