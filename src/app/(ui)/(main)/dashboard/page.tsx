"use client";

import FullScreenLoader from "@/components/full-screen-loader";
import { useAuth } from "@/context-providers/auth-context-provider";
import HealthScoreWidget from '@/components/dashboard/health-score-widget';
import APIRequestsChart from "@/components/dashboard/api-requests-chart";
import CacheHitRateChart from "@/components/dashboard/cache-hit-rate-chart";
import AuthMetricsChart from "@/components/dashboard/auth-metrics-chart";
import AllowedDomainsChart from "@/components/dashboard/allowed-domains-chart";

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
        <CacheHitRateChart />

        {/* Auth Success vs Failures */}
        <AuthMetricsChart />

        {/* Allowed Email Domains */}
        <AllowedDomainsChart />
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