import { NextResponse } from 'next/server';
import { 
  blacklistForwarder, 
  activateForwarder, 
  deactivateForwarder 
} from '@/data-access/forwarderRelationships';
import { auth } from '@clerk/nextjs/server';
import { getUserCompanyMembership } from '@/data-access/companies';

/**
 * PATCH /api/freight-forwarders/[id]/relationship
 * Updates the relationship status with a freight forwarder
 */
export async function PATCH(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's company membership to get exporterId
    const membership = await getUserCompanyMembership(userId);
    
    if (!membership || !membership.companies) {
      return NextResponse.json(
        { error: 'User company membership not found' },
        { status: 400 }
      );
    }

    const exporterId = membership.companies.id;
    const { id: forwarderId } = params;
    const { action, reason } = await request.json();

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