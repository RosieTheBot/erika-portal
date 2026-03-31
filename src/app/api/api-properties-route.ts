/**
 * API Route: /api/properties
 * CRUD endpoints for properties
 * GET - List all properties
 * POST - Create property (manual entry)
 * PATCH - Update property
 * DELETE - Delete property
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// GET /api/properties
export async function GET(_request: Request) {
  try {
    const url = new URL(_request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const status = url.searchParams.get('status');
    const propertyType = url.searchParams.get('type');
    const search = url.searchParams.get('search');

    let query = supabase
      .from('properties')
      .select(
        `
        id,
        address,
        city,
        state,
        zip,
        price,
        bedrooms,
        bathrooms,
        sqft,
        price_per_sqft,
        mls_number,
        source,
        property_type,
        status,
        created_at,
        property_photos(id, photo_url, display_order),
        str_data(regulations, revenue_estimate, str_notes)
        `,
        { count: 'exact' }
      )
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (propertyType) {
      query = query.eq('property_type', propertyType);
    }

    if (search) {
      query = query.or(`address.ilike.%${search}%,city.ilike.%${search}%,mls_number.eq.${search}`);
    }

    const { data, error, count } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      properties: data,
      total: count,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Error fetching properties:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/properties
export async function POST(_request: Request) {
  try {
    const body = await _request.json();
    const {
      address,
      city,
      state,
      zip,
      price,
      bedrooms,
      bathrooms,
      sqft,
      public_remarks,
      property_type = 'residential',
    } = body;

    if (!address || !city || !state) {
      return Response.json(
        { error: 'Address, city, and state are required' },
        { status: 400 }
      );
    }

    const pricePerSqft = sqft && price ? price / sqft : 0;

    const { data, error } = await supabase
      .from('properties')
      .insert([
        {
          address,
          city,
          state,
          zip,
          price,
          bedrooms,
          bathrooms,
          sqft,
          price_per_sqft: pricePerSqft,
          public_remarks,
          source: 'Manual',
          property_type,
          status: 'available',
        },
      ])
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, property: data }, { status: 201 });

  } catch (error) {
    console.error('Error creating property:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/properties
export async function PATCH(_request: Request) {
  try {
    const body = await _request.json();
    const { id, ...updates } = body;

    if (!id) {
      return Response.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('properties')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, property: data });

  } catch (error) {
    console.error('Error updating property:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/properties
export async function DELETE(_request: Request) {
  try {
    const body = await _request.json();
    const { id } = body;

    if (!id) {
      return Response.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Property deleted' });

  } catch (error) {
    console.error('Error deleting property:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
