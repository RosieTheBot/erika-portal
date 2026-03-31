/**
 * API Route: POST /api/properties/scrape-url
 * Scrapes property data from Zillow/Redfin/Realtor link
 * Request body: { url: string, propertyType?: 'residential' | 'str' }
 */

import { createClient } from '@supabase/supabase-js';
import { webScraper } from '@/lib/web-scraper';

export async function POST(_request: Request) {
  try {
    const body = await _request.json();
    const { url, propertyType = 'residential' } = body;

    if (!url) {
      return Response.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return Response.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Scrape property from URL
    const scrapedProperty = await webScraper.scrapePropertyFromURL(url);

    if (!scrapedProperty) {
      return Response.json(
        { error: 'Failed to scrape property from URL. Check the link and try again.' },
        { status: 400 }
      );
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    );

    // Check if property already exists
    const { data: existingProperty } = await supabase
      .from('properties')
      .select('id')
      .eq('address', scrapedProperty.address)
      .single()
      .catch(() => ({ data: null }));

    if (existingProperty) {
      return Response.json(
        { error: 'Property already exists in system' },
        { status: 409 }
      );
    }

    // Insert property
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .insert([
        {
          address: scrapedProperty.address,
          city: scrapedProperty.city,
          state: scrapedProperty.state,
          zip: scrapedProperty.zip,
          price: scrapedProperty.price,
          bedrooms: scrapedProperty.bedrooms,
          bathrooms: scrapedProperty.bathrooms,
          sqft: scrapedProperty.sqft,
          price_per_sqft: scrapedProperty.sqft > 0 ? scrapedProperty.price / scrapedProperty.sqft : 0,
          public_remarks: scrapedProperty.public_remarks,
          source: scrapedProperty.source,
          source_url: scrapedProperty.source_url,
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
    if (scrapedProperty.photos && scrapedProperty.photos.length > 0) {
      const photoRecords = scrapedProperty.photos.map((photo, index) => ({
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
      source: scrapedProperty.source,
      photosCount: scrapedProperty.photos?.length || 0,
    });

  } catch (error) {
    console.error('Error scraping property:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
