/**
 * API Route: /api/properties/[propertyId]/assign
 * Assign property to buyers
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export async function POST(
  request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const body = await request.json();
    const { buyer_ids } = body;

    if (!buyer_ids || !Array.isArray(buyer_ids) || buyer_ids.length === 0) {
      return Response.json(
        { error: 'buyer_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    // Create assignment records
    const assignments = buyer_ids.map((buyerId: string) => ({
      property_id: params.propertyId,
      buyer_id: buyerId,
      access_type: 'assigned',
    }));

    const { data, error } = await supabase
      .from('property_access')
      .upsert(assignments, { onConflict: 'property_id,buyer_id' })
      .select();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      assigned: data?.length || 0,
    });

  } catch (error) {
    console.error('Error assigning property:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET assigned buyers
export async function GET(
  request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { data, error } = await supabase
      .from('property_access')
      .select('buyer_id')
      .eq('property_id', params.propertyId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const buyers = data?.map((a: any) => a.buyer_id) || [];

    return Response.json({ buyers });

  } catch (error) {
    console.error('Error fetching assignments:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE assignment
export async function DELETE(
  request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const body = await request.json();
    const { buyer_id } = body;

    if (!buyer_id) {
      return Response.json(
        { error: 'buyer_id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('property_access')
      .delete()
      .eq('property_id', params.propertyId)
      .eq('buyer_id', buyer_id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Assignment removed' });

  } catch (error) {
    console.error('Error removing assignment:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
