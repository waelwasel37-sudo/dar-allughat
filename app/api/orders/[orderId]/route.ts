// app/api/orders/[orderId]/route.ts
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// The fundamental change here: adding a Promise to be compatible with Next.js 15
interface RouteContext {
  params: Promise<{
    orderId: string;
  }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext 
) {
  // Mandatory step: await must be used to get the orderId
  const { orderId } = await context.params; 

  console.log(`Build-fix: Received PATCH request for order ${orderId}.`);

  return NextResponse.json({
    message: `Successfully received request for order ${orderId}.`
  });
}
