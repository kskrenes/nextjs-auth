export default function getUAAndIpFromRequest(request: Request): { userAgent: string; ipAddress: string } {
  const userAgent = request.headers.get('user-agent') || '';
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 'Unknown';
  return { userAgent, ipAddress };
}