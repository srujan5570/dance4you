import { NextRequest, NextResponse } from 'next/server';
import { readSessionCookie } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await readSessionCookie();
    if (!session?.authenticated || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await request.json();

    // Validate subscription object
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    // Store subscription in database
    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: session.userId,
          endpoint: subscription.endpoint
        }
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updatedAt: new Date()
      },
      create: {
        userId: session.userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await readSessionCookie();
    if (!session?.authenticated || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    // Remove subscription from database
    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.userId,
        endpoint: endpoint
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}