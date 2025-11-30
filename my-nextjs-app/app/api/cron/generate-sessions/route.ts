import { NextRequest, NextResponse } from 'next/server';
import { generateAllSessions } from '@/lib/utils/session-generator';

/**
 * Cron Job Endpoint: Generate Sessions
 *
 * This endpoint is called daily by Vercel Cron to:
 * 1. Generate sessions from recurring bookings for the next 6 weeks
 * 2. Mark past sessions as completed
 *
 * Security: Protected by Authorization header or Vercel Cron secret
 */
export async function GET(request: NextRequest) {
  try {
    // Security: Check authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow requests from Vercel Cron or with valid secret
    const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron');
    const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isVercelCron && !hasValidSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run session generation
    const result = await generateAllSessions(6); // 6 weeks ahead

    console.log('Cron job completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Sessions generated successfully',
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual testing
 */
export async function POST(request: NextRequest) {
  // Same logic as GET, but requires admin authentication
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid secret' },
        { status: 401 }
      );
    }

    const result = await generateAllSessions(6);

    return NextResponse.json({
      success: true,
      message: 'Manual session generation completed',
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Manual generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
