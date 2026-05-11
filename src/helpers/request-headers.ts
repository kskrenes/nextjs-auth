export default function getUAAndIpFromRequest(request: Request): { userAgent: string; ipAddress: string } {
  const userAgent = request.headers.get('user-agent') || '';
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = 
    forwardedFor?.split(',')[0].trim() || 
    request.headers.get('x-real-ip')?.trim() || 
    'Unknown';
    
  return { userAgent, ipAddress };
}