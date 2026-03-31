/**
 * BuyerPropertyDiscovery Component
 * Buyer property discovery portal
 * Shows assigned properties + buyer's own watchlist
 * Features: search, filter, property cards with engagement
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BuyerPropertyCard } from './BuyerPropertyCard';
import { AlertCircle, Loader, Link as LinkIcon } from 'lucide-react';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  price_per_sqft: number;
  public_remarks: string;
  property_photos: Array<{ id: string; photo_url: string; display_order: number }>;
  str_data?: {
    regulations: string;
    revenue_estimate: number;
    str_notes: string;
  };
  property_type: 'residential' | 'str';
}

interface BuyerPropertyDiscoveryProps {
  buyerId: string;
  onPropertyView?: (propertyId: string) => void;
}

export function BuyerPropertyDiscovery({ buyerId, onPropertyView }: BuyerPropertyDiscoveryProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pasteUrl, setPasteUrl] = useState('');
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  // Fetch assigned properties
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        buyer_id: buyerId,
      });

      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);

      const response = await fetch(`/api/buyer-properties?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        let filtered = data.properties;

        // Client-side price filtering
        if (priceFilter) {
          const [min, max] = priceFilter.split('-').map((v) => parseInt(v));
          filtered = filtered.filter((p: Property) => {
            if (isNaN(max)) {
              return p.price >= min;
            }
            return p.price >= min && p.price <= max;
          });
        }

        setProperties(filtered);
      } else {
        setError('Failed to load properties');
      }
    } catch (err) {
      setError('Error loading properties');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [search, typeFilter, priceFilter]);

  // Handle paste URL for watchlist
  const handlePasteUrl = async () => {
    setPasteLoading(true);
    setPasteError(null);

    try {
      const response = await fetch('/api/buyer-properties/add-from-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_id: buyerId,
          url: pasteUrl.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasteUrl('');
        // Refresh properties
        fetchProperties();
      } else {
        setPasteError(data.error || 'Failed to add property');
      }
    } catch (err) {
      setPasteError('Error adding property from link');
      console.error(err);
    } finally {
      setPasteLoading(false);
    }
  };

  // Handle engagement actions
  const handleLike = async (propertyId: string) => {
    try {
      await fetch(`/api/properties/${propertyId}/engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: buyerId,
          userType: 'buyer',
          engagementType: 'like',
        }),
      });
    } catch (err) {
      console.error('Error liking property:', err);
    }
  };

  const handleTrash = async (propertyId: string) => {
    try {
      await fetch(`/api/properties/${propertyId}/engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: buyerId,
          userType: 'buyer',
          engagementType: 'trash',
        }),
      });
    } catch (err) {
      console.error('Error trashing property:', err);
    }
  };

  const handleComment = (propertyId: string) => {
    // Open comment modal or navigate to details
    onPropertyView?.(propertyId);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Property Discovery</h1>
        <p className="text-gray-600 mt-1">
          Browse properties assigned to you and add your own from Zillow, Redfin, or Realtor.com
        </p>
      </div>

      {/* Add from Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
          <LinkIcon className="w-4 h-4" />
          Found a property? Add it to your watchlist
        </h3>
        <div className="flex flex-col md:flex-row gap-2">
          <Input
            placeholder="Paste a Zillow, Redfin, or Realtor.com link..."
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            disabled={pasteLoading}
            type="url"
            className="flex-1"
          />
          <Button
            onClick={handlePasteUrl}
            disabled={!pasteUrl || pasteLoading}
            className="whitespace-nowrap"
          >
            {pasteLoading ? 'Adding...' : 'Add to Watchlist'}
          </Button>
        </div>
        {pasteError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {pasteError}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search by address or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Property type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="str">Short-Term Rental</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priceFilter} onValueChange={setPriceFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Price range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Price</SelectItem>
            <SelectItem value="0-300000">Under $300k</SelectItem>
            <SelectItem value="300000-500000">$300k - $500k</SelectItem>
            <SelectItem value="500000-750000">$500k - $750k</SelectItem>
            <SelectItem value="750000-1000000">$750k - $1M</SelectItem>
            <SelectItem value="1000000-">$1M+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No properties found</p>
          <p className="text-sm text-gray-500">
            Properties will appear here once they're assigned to you or added to your watchlist
          </p>
        </div>
      ) : (
        <>
          {/* Results Count */}
          <p className="text-sm text-gray-600">
            Showing {properties.length} propert{properties.length === 1 ? 'y' : 'ies'}
          </p>

          {/* Property Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => (
              <BuyerPropertyCard
                key={property.id}
                property={property}
                userId={buyerId}
                userType="buyer"
                onLike={handleLike}
                onTrash={handleTrash}
                onComment={handleComment}
                onViewDetails={onPropertyView}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
