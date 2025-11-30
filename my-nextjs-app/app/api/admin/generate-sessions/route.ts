import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { generateAllSessions } from '@/lib/utils/session-generator';

/**
 * Admin Endpoint: Manually trigger session generation
 *
 * This endpoint allows owners/admins to manually trigger session generation
 * Useful for testing or immediate generation after config changes
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Unauthorized - Owner role required' },
        { status: 403 }
      );
    }

    // Parse request body for custom options
    const body = await request.json().catch(() => ({}));
    const weeksAhead = body.weeksAhead || 6;

    // Run session generation
    const result = await generateAllSessions(weeksAhead);

    return NextResponse.json({
      success: true,
      message: `Sessions generated for the next ${weeksAhead} weeks`,
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

/**
 * GET endpoint for status/info
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session generation endpoint is ready',
      info: {
        description: 'Use POST to trigger manual session generation',
        defaultWeeksAhead: 6,
        example: {
          method: 'POST',
          body: { weeksAhead: 8 },
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error' },
      { status: 500 }
    );
  }
}
