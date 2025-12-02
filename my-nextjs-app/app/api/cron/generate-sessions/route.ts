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
    // Security: Check authorization - ONLY accept valid Bearer token
    // Note: User-Agent check removed as it can be spoofed
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
        // Only expose error details in development
        ...(process.env.NODE_ENV === 'development' && {
          debug: error instanceof Error ? error.message : 'Unknown error',
        }),
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
        // Only expose error details in development
        ...(process.env.NODE_ENV === 'development' && {
          debug: error instanceof Error ? error.message : 'Unknown error',
        }),
      },
      { status: 500 }
    );
  }
}
