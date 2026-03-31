/**
 * API Route: POST /api/properties/import-mls
 * Imports a property from MLS Grid by MLS number
 * Request body: { mlsNumber: string, propertyType?: 'residential' | 'str' }
 */

import { createClient } from '@supabase/supabase-js';
import { mlsGridAPI } from '@/lib/mls-grid-wrapper';

export async function POST(_request: Request) {
  try {
    const body = await _request.json();
    const { mlsNumber, propertyType = 'residential' } = body;

    if (!mlsNumber) {
      return Response.json(
        { error: 'MLS number is required' },
        { status: 400 }
      );
    }

    // Fetch property from MLS Grid
    const mlsProperty = await mlsGridAPI.getPropertyByMLSNumber(mlsNumber);

    if (!mlsProperty) {
      return Response.json(
        { error: 'Property not found in MLS Grid' },
        { status: 404 }
      );
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    );

    // Insert property
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .insert([
        {
          address: mlsProperty.address,
          city: mlsProperty.city,
          state: mlsProperty.state,
          zip: mlsProperty.zip,
          price: mlsProperty.price,
          bedrooms: mlsProperty.bedrooms,
          bathrooms: mlsProperty.bathrooms,
          sqft: mlsProperty.sqft,
          price_per_sqft: mlsProperty.bedrooms > 0 ? mlsProperty.price / (mlsProperty.sqft || 1) : 0,
          public_remarks: mlsProperty.public_remarks,
          mls_number: mlsNumber,
          source: 'MLS Grid',
          source_url: mlsProperty.source_url,
          property_type: propertyType,
          status: 'available',
        },
      ])
      .select()
      .single();

    if (propertyError) {
      console.error('Property insert error:', propertyError);
      return Response.json(
        { error: `Failed to save property: ${propertyError.message}` },
        { status: 500 }
      );
    }

    // Insert photos
    if (mlsProperty.photos && mlsProperty.photos.length > 0) {
      const photoRecords = mlsProperty.photos.map((photo, index) => ({
        property_id: propertyData.id,
        photo_url: photo.url,
        display_order: index,
      }));

      const { error: photoError } = await supabase
        .from('property_photos')
        .insert(photoRecords);

      if (photoError) {
        console.error('Photo insert error:', photoError);
        // Don't fail, just log
      }
    }

    return Response.json({
      success: true,
      property: propertyData,
      photosCount: mlsProperty.photos?.length || 0,
    });

  } catch (error) {
    console.error('Error importing property:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
