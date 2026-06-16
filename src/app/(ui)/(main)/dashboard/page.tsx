"use client";

import FullScreenLoader from "@/components/full-screen-loader";
import { useAuth } from "@/context-providers/auth-context-provider";
import HealthScoreWidget from '@/components/dashboard/health-score-widget';
import APIRequestsChart from "@/components/dashboard/api-requests-chart";
import CacheHitRateChart from "@/components/dashboard/cache-hit-rate-chart";
import AuthMetricsChart from "@/components/dashboard/auth-metrics-chart";
import AllowedDomainsChart from "@/components/dashboard/allowed-domains-chart";
import SecurityRecommendationsChart from "@/components/dashboard/security-recommendations-chart";

const DashboardPage = () => {

  const { user, fetchingUser } = useAuth();

  if (fetchingUser || !user) return <FullScreenLoader />;

  const hasGoogleProvider = user.linkedProviders.includes('google');
  const healthChecks = [
    { name: 'Multi-Factor Authentication', enabled: user.mfaEnabled, weight: 30 },
    { name: 'Passkey Authentication', enabled: user.hasPasskey, weight: 25 },
    { name: 'Strong Password', enabled: user.hasStrongPassword || hasGoogleProvider, weight: 25 },
    { name: 'Verified Email', enabled: user.isVerified || hasGoogleProvider, weight: 20 },
  ];

  const healthScore = healthChecks.reduce((score, check) => {
    return score + (check.enabled ? check.weight : 0);
  }, 0);

  return (
    <div className="page-container">

      {/* page title */}
      <div className="page-title-container">
        <h1 className="page-title">Security & Operations Dashboard</h1>
        <p className="text-sm text-foreground-secondary mt-1">Monitor your account security and system metrics</p>
      </div>

      {/* Security Health Score */}
      <HealthScoreWidget healthChecks={healthChecks} healthScore={healthScore} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-6">
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
      {healthScore < 100 && (
        <SecurityRecommendationsChart user={user} />
      )}
    </div>
  );
}

export default DashboardPage