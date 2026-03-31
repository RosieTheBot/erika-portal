/**
 * API Route: /api/properties/[propertyId]
 * Get single property with engagement data
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export async function GET(
  _request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    // Fetch property
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select(
        `
        *,
        property_photos(id, photo_url, display_order),
        str_data(regulations, revenue_estimate, str_notes)
        `
      )
      .eq('id', params.propertyId)
      .single();

    if (propError) {
      return Response.json({ error: 'Property not found' }, { status: 404 });
    }

    // Fetch engagement
    const { data: engagement, error: engError } = await supabase
      .from('property_engagement')
      .select('*')
      .eq('property_id', params.propertyId)
      .order('created_at', { ascending: false });

    if (engError) {
      console.error('Error fetching engagement:', engError);
    }

    return Response.json({
      property,
      engagement: engagement || [],
    });

  } catch (error) {
    console.error('Error fetching property:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
