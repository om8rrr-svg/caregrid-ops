import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/api-auth';
import type { SystemHealth, HealthCheck } from '@/types';

// Mock health data (in production, this would be fetched from monitoring systems)
const getSystemHealth = (): SystemHealth => {
  const services: HealthCheck[] = [
    {
      id: '1',
      service: 'caregrid-api',
      status: 'healthy',
      responseTime: 120,
      timestamp: new Date(),
      details: {
        endpoint: 'https://caregrid-backend.onrender.com/api/health',
        version: '1.2.3',
      },
    },
    {
      id: '2',
      service: 'database',
      status: 'healthy',
      responseTime: 45,
      timestamp: new Date(),
      details: {
        connectionPool: 'active',
        activeConnections: 12,
        maxConnections: 100,
      },
    },
    {
      id: '3',
      service: 'redis-cache',
      status: 'degraded',
      responseTime: 250,
      timestamp: new Date(),
      details: {
        memoryUsage: '78%',
        keyCount: 45230,
      },
    },
    {
      id: '4',
      service: 'email-service',
      status: 'healthy',
      responseTime: 95,
      timestamp: new Date(),
      details: {
        provider: 'SendGrid',
        quotaUsed: '23%',
      },
    },
  ];

  const overallStatus = services.some(s => s.status === 'unhealthy') 
    ? 'unhealthy'
    : services.some(s => s.status === 'degraded')
    ? 'degraded' 
    : 'healthy';

  return {
    overall: overallStatus,
    services,
    uptime: Date.now() - new Date('2024-01-01').getTime(),
    lastUpdated: new Date(),
  };
};

// GET /api/ops/health - Get system health (Manager+ can read)
export const GET = createProtectedRoute(
  ['admin', 'manager'],
  async (request: NextRequest) => {
    const url = new URL(request.url);
    const service = url.searchParams.get('service');

    const healthData = getSystemHealth();

    // Filter by specific service if requested
    if (service) {
      const serviceHealth = healthData.services.find(s => s.service === service);
      if (!serviceHealth) {
        return NextResponse.json(
          {
            success: false,
            error: 'Service not found',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: serviceHealth,
      });
    }

    return NextResponse.json({
      success: true,
      data: healthData,
    });
  }
);

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}