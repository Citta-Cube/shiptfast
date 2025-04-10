import { NextResponse } from 'next/server';
import { 
  blacklistForwarder, 
  activateForwarder, 
  deactivateForwarder 
} from '@/data-access/forwarderRelationships';

/**
 * PATCH /api/freight-forwarders/[id]/relationship
 * Updates the relationship status with a freight forwarder
 */
export async function PATCH(request, { params }) {
  try {
    const { id: forwarderId } = params;
    const { action, reason } = await request.json();
    
    // TODO: Get exporterId from authenticated session
    const exporterId = 'e0912188-4fbd-415e-b5a7-19b35cfbab42';

    let result;
    
    switch (action) {
      case 'blacklist':
        if (!reason) {
          return NextResponse.json(
            { error: 'Reason is required for blacklisting' },
            { status: 400 }
          );
        }
        result = await blacklistForwarder({
          exporterId,
          forwarderId,
          reason
        });
        break;

      case 'deactivate':
        result = await deactivateForwarder({
          exporterId,
          forwarderId
        });
        break;

      case 'activate':
        result = await activateForwarder({
          exporterId,
          forwarderId
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be one of: blacklist, deactivate, activate' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Forwarder successfully ${action}ed`,
      data: result
    });

  } catch (error) {
    console.error('Error updating forwarder relationship:', error);
    
    // Handle known error types
    if (error.message.includes('Missing required parameters')) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Handle database constraint violations
    if (error.code === '23503') { // Foreign key violation
      return NextResponse.json(
        { error: 'Invalid forwarder or exporter ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 