/**
 * STR Matchmaker Sync
 * Merges property data with STR-specific information
 * Matches properties by address against STR Matchmaker sheet
 * Pulls: regulations, revenue, STR notes
 */

import { createClient } from '@supabase/supabase-js';

interface STRData {
  regulations: string | null;
  revenue_estimate: number | null;
  str_notes: string | null;
  matchmaker_id: string | null;
}

class STRMatchmakerSync {
  private supabaseUrl = 'https://qkdhcwwdldkimytghozu.supabase.co'; // STR Matchmaker project
  private supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
  private client = createClient(this.supabaseUrl, this.supabaseKey);

  /**
   * Fuzzy match property address against STR Matchmaker
   * @param address - Property address
   * @param city - City
   * @returns STR data if match found
   */
  async syncPropertyData(
    address: string,
    city?: string
  ): Promise<STRData> {
    try {
      // Query STR Matchmaker sheet for matching property
      // Using ilike for fuzzy matching (case-insensitive substring)
      let query = this.client
        .from('properties') // Assuming this table exists in STR Matchmaker
        .select('*')
        .ilike('address', `%${address}%`);

      if (city) {
        query = query.ilike('city', `%${city}%`);
      }

      const { data, error } = await query.limit(1);

      if (error) {
        console.error('Error querying STR Matchmaker:', error);
        return this.emptySTRData();
      }

      if (!data || data.length === 0) {
        console.warn(`No match found for: ${address}, ${city}`);
        return this.emptySTRData();
      }

      const matchedProperty = data[0];

      // Extract STR-specific fields
      return {
        regulations: matchedProperty.regulations || null,
        revenue_estimate: matchedProperty.revenue || null,
        str_notes: matchedProperty.str_notes || null,
        matchmaker_id: matchedProperty.id?.toString() || null,
      };

    } catch (error) {
      console.error('Error syncing STR data:', error);
      return this.emptySTRData();
    }
  }

  /**
   * Sync STR data to Portal database
   * @param propertyId - Portal property ID
   * @param strData - STR data to save
   */
  async saveSTRData(
    propertyId: number,
    strData: STRData,
    portalSupabaseKey: string = process.env.SUPABASE_SERVICE_KEY || ''
  ): Promise<boolean> {
    try {
      const portalClient = createClient(
        'https://wneyuzqffqbmtlqlllpp.supabase.co', // Portal project
        portalSupabaseKey
      );

      const { error } = await portalClient
        .from('str_data')
        .upsert([
          {
            property_id: propertyId,
            regulations: strData.regulations,
            revenue_estimate: strData.revenue_estimate,
            str_notes: strData.str_notes,
            matchmaker_id: strData.matchmaker_id,
            synced_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        console.error('Error saving STR data:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Error saving STR data:', error);
      return false;
    }
  }

  /**
   * Get STR data for property
   * @param propertyId - Portal property ID
   */
  async getSTRData(
    propertyId: number,
    portalSupabaseKey: string = process.env.SUPABASE_SERVICE_KEY || ''
  ): Promise<STRData | null> {
    try {
      const portalClient = createClient(
        'https://wneyuzqffqbmtlqlllpp.supabase.co',
        portalSupabaseKey
      );

      const { data, error } = await portalClient
        .from('str_data')
        .select('*')
        .eq('property_id', propertyId)
        .single();

      if (error) {
        console.error('Error fetching STR data:', error);
        return null;
      }

      return {
        regulations: data?.regulations || null,
        revenue_estimate: data?.revenue_estimate || null,
        str_notes: data?.str_notes || null,
        matchmaker_id: data?.matchmaker_id || null,
      };

    } catch (error) {
      console.error('Error fetching STR data:', error);
      return null;
    }
  }

  /**
   * Return empty STR data structure
   */
  private emptySTRData(): STRData {
    return {
      regulations: null,
      revenue_estimate: null,
      str_notes: null,
      matchmaker_id: null,
    };
  }

  /**
   * Batch sync multiple properties
   * @param properties - Array of {address, city, propertyId}
   */
  async batchSync(
    properties: Array<{
      address: string;
      city?: string;
      propertyId: number;
    }>,
    portalSupabaseKey: string = process.env.SUPABASE_SERVICE_KEY || ''
  ): Promise<{
    synced: number;
    failed: number;
    total: number;
  }> {
    let synced = 0;
    let failed = 0;

    for (const prop of properties) {
      try {
        const strData = await this.syncPropertyData(prop.address, prop.city);
        const saved = await this.saveSTRData(prop.propertyId, strData, portalSupabaseKey);

        if (saved) {
          synced++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error syncing property ${prop.address}:`, error);
        failed++;
      }
    }

    return {
      synced,
      failed,
      total: properties.length,
    };
  }
}

// Export singleton instance
export const strMatchmakerSync = new STRMatchmakerSync();

// Export type
export type { STRData };
