/**
 * MLS Grid API Wrapper
 * Handles all communication with MLS Grid VOW API
 * Endpoint: https://api.mlsgrid.com/v2
 * Access Token: 93d6023282beffabbfd22b77483fd48c0bb0b682
 */

interface MLSProperty {
  id?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  price?: number;
  bedroomsTotal?: number;
  bathroomsTotalInteger?: number;
  livingArea?: number;
  publicRemarks?: string;
  listingKey?: string;
  photos?: Array<{
    mediaURL?: string;
    order?: number;
  }>;
  [key: string]: any;
}

interface PropertyRecord {
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  public_remarks: string;
  mls_number: string;
  source: 'MLS Grid';
  source_url: string;
  property_type: 'residential' | 'str';
  photos: Array<{
    url: string;
    order: number;
  }>;
}

class MLSGridAPI {
  private endpoint = 'https://api.mlsgrid.com/v2';
  private accessToken = '93d6023282beffabbfd22b77483fd48c0bb0b682';
  private headers = {
    'Authorization': `Bearer ${this.accessToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  /**
   * Search for property by MLS number
   * @param mlsNumber - MLS listing number
   * @returns Property data
   */
  async getPropertyByMLSNumber(mlsNumber: string): Promise<PropertyRecord | null> {
    try {
      // MLS Grid API endpoint for property search
      // Typically: GET /properties?filter=ListingKey eq 'mlsNumber'
      const url = `${this.endpoint}/properties`;
      const filter = `ListingKey eq '${mlsNumber}'`;
      const query = `?$filter=${encodeURIComponent(filter)}&$select=*`;

      const response = await fetch(`${url}${query}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        console.error(`MLS Grid API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      
      if (!data.value || data.value.length === 0) {
        console.warn(`No property found for MLS number: ${mlsNumber}`);
        return null;
      }

      const mlsProperty = data.value[0] as MLSProperty;
      return this.transformMLSProperty(mlsProperty);

    } catch (error) {
      console.error('Error fetching from MLS Grid:', error);
      return null;
    }
  }

  /**
   * Search for properties by address
   * @param address - Street address
   * @param city - City
   * @param state - State (2-letter code)
   * @returns Array of matching properties
   */
  async getPropertiesByAddress(
    address: string,
    city?: string,
    state?: string
  ): Promise<PropertyRecord[]> {
    try {
      const url = `${this.endpoint}/properties`;
      
      // Build filter: StreetAddress contains 'address' AND City contains 'city'
      let filter = `contains(StreetAddress,'${this.escapeFilter(address)}')`;
      if (city) {
        filter += ` AND contains(City,'${this.escapeFilter(city)}')`;
      }
      if (state) {
        filter += ` AND StateOrProvince eq '${state.toUpperCase()}'`;
      }

      const query = `?$filter=${encodeURIComponent(filter)}&$top=10&$select=*`;

      const response = await fetch(`${url}${query}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        console.error(`MLS Grid API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      
      if (!data.value || data.value.length === 0) {
        console.warn(`No properties found for: ${address}, ${city}, ${state}`);
        return [];
      }

      return data.value.map((prop: MLSProperty) => this.transformMLSProperty(prop))
        .filter((prop): prop is PropertyRecord => prop !== null);

    } catch (error) {
      console.error('Error fetching from MLS Grid:', error);
      return [];
    }
  }

  /**
   * Transform MLS Grid property data to our internal format
   * @param mlsProperty - Raw MLS Grid property
   * @returns Transformed property record
   */
  private transformMLSProperty(mlsProperty: MLSProperty): PropertyRecord | null {
    try {
      // Extract address parts
      const address = mlsProperty.address || mlsProperty.StreetAddress || '';
      const city = mlsProperty.city || mlsProperty.City || '';
      const state = mlsProperty.state || mlsProperty.StateOrProvince || '';
      const zip = mlsProperty.postalCode || mlsProperty.PostalCode || '';

      if (!address) {
        console.warn('Property missing address:', mlsProperty);
        return null;
      }

      // Calculate price per sqft
      const price = mlsProperty.price || mlsProperty.ListPrice || 0;
      const sqft = mlsProperty.sqft || mlsProperty.livingArea || mlsProperty.LivingArea || 0;
      const pricePerSqft = sqft > 0 ? price / sqft : 0;

      // Extract photos
      const photos = (mlsProperty.photos || mlsProperty.Photos || [])
        .map((photo: any, index: number) => ({
          url: photo.mediaURL || photo.MediaURL || '',
          order: photo.order || index,
        }))
        .filter((photo: any) => photo.url)
        .sort((a: any, b: any) => a.order - b.order);

      return {
        address,
        city,
        state,
        zip,
        price: price || 0,
        bedrooms: mlsProperty.bedroomsTotal || mlsProperty.BedroomsTotal || 0,
        bathrooms: mlsProperty.bathroomsTotalInteger || mlsProperty.BathroomsTotalInteger || 0,
        sqft: sqft || 0,
        public_remarks: mlsProperty.publicRemarks || mlsProperty.PublicRemarks || '',
        mls_number: mlsProperty.listingKey || mlsProperty.ListingKey || '',
        source: 'MLS Grid',
        source_url: `https://mlsgrid.com/search?mls=${mlsProperty.listingKey || mlsProperty.ListingKey}`,
        property_type: 'residential', // Default, can be updated manually
        photos,
      };

    } catch (error) {
      console.error('Error transforming MLS property:', error, mlsProperty);
      return null;
    }
  }

  /**
   * Escape special characters in filter strings
   * @param value - String to escape
   * @returns Escaped string
   */
  private escapeFilter(value: string): string {
    return value
      .replace(/'/g, "''")
      .replace(/"/g, '""');
  }

  /**
   * Verify API connection is working
   * @returns True if API is accessible
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.endpoint}/properties?$top=1`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      return response.ok;
    } catch (error) {
      console.error('MLS Grid API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get API rate limit status
   * @returns Rate limit info from headers
   */
  async getRateLimitStatus(): Promise<{
    limit: string | null;
    remaining: string | null;
    reset: string | null;
  }> {
    try {
      const url = `${this.endpoint}/properties?$top=1`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      return {
        limit: response.headers.get('x-ratelimit-limit'),
        remaining: response.headers.get('x-ratelimit-remaining'),
        reset: response.headers.get('x-ratelimit-reset'),
      };
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return {
        limit: null,
        remaining: null,
        reset: null,
      };
    }
  }
}

// Export singleton instance
export const mlsGridAPI = new MLSGridAPI();

// Export types
export type { MLSProperty, PropertyRecord };
