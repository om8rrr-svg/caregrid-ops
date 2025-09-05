import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/api-auth';

interface SyntheticTest {
  id: string;
  name: string;
  url: string;
  method: string;
  status: 'passing' | 'failing' | 'unknown';
  lastRun: Date;
  responseTime: number;
  uptime: number;
  description: string;
}

// Mock synthetic test data (in production, this would be fetched from monitoring systems)
const getSyntheticTests = (): SyntheticTest[] => {
  return [
    {
      id: '1',
      name: 'User Login Flow',
      url: 'https://caregrid-backend.onrender.com/api/auth/login',
      method: 'POST',
      status: 'passing',
      lastRun: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      responseTime: 245,
      uptime: 99.8,
      description: 'Tests the complete user authentication flow',
    },
    {
      id: '2',
      name: 'Appointment Booking',
      url: 'https://caregrid-backend.onrender.com/api/appointments',
      method: 'POST',
      status: 'passing',
      lastRun: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
      responseTime: 180,
      uptime: 99.5,
      description: 'Tests appointment creation and booking process',
    },
    {
      id: '3',
      name: 'Patient Records Access',
      url: 'https://caregrid-backend.onrender.com/api/patients',
      method: 'GET',
      status: 'failing',
      lastRun: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      responseTime: 5000,
      uptime: 95.2,
      description: 'Tests patient record retrieval and access',
    },
    {
      id: '4',
      name: 'Health Check',
      url: 'https://caregrid-backend.onrender.com/api/health',
      method: 'GET',
      status: 'passing',
      lastRun: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
      responseTime: 89,
      uptime: 99.9,
      description: 'Basic health check endpoint monitoring',
    },
  ];
};

// GET /api/ops/synthetic - Get synthetic test results (Manager+ can read)
export const GET = createProtectedRoute(
  ['admin', 'manager'],
  async (request: NextRequest) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const testId = url.searchParams.get('id');

    let syntheticTests = getSyntheticTests();

    // Filter by specific test if requested
    if (testId) {
      const test = syntheticTests.find(t => t.id === testId);
      if (!test) {
        return NextResponse.json(
          {
            success: false,
            error: 'Synthetic test not found',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: test,
      });
    }

    // Filter by status if requested
    if (status) {
      syntheticTests = syntheticTests.filter(test => test.status === status);
    }

    // Calculate summary statistics
    const summary = {
      total: syntheticTests.length,
      passing: syntheticTests.filter(t => t.status === 'passing').length,
      failing: syntheticTests.filter(t => t.status === 'failing').length,
      unknown: syntheticTests.filter(t => t.status === 'unknown').length,
      averageResponseTime: Math.round(
        syntheticTests.reduce((sum, t) => sum + t.responseTime, 0) / syntheticTests.length
      ),
      averageUptime: Math.round(
        syntheticTests.reduce((sum, t) => sum + t.uptime, 0) / syntheticTests.length * 100
      ) / 100,
    };

    return NextResponse.json({
      success: true,
      data: {
        tests: syntheticTests,
        summary,
      },
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