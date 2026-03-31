/**
 * PropertyUploadForm Component
 * Tabbed interface for uploading properties via:
 * 1. MLS number (MLS Grid API)
 * 2. URL paste (Zillow/Redfin/Realtor web scraper)
 * 3. Manual entry
 */

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface FormStatus {
  type: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

export function PropertyUploadForm() {
  const [activeTab, setActiveTab] = useState<'mls' | 'link' | 'manual'>('mls');
  const [status, setStatus] = useState<FormStatus>({ type: 'idle', message: '' });

  // MLS Form
  const [mlsNumber, setMlsNumber] = useState('');
  const [mlsPropertyType, setMlsPropertyType] = useState<'residential' | 'str'>(
    'residential'
  );

  // Link Form
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPropertyType, setLinkPropertyType] = useState<'residential' | 'str'>(
    'residential'
  );

  // Manual Form
  const [manualForm, setManualForm] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    remarks: '',
    propertyType: 'residential' as 'residential' | 'str',
  });

  // Handle MLS Import
  const handleMlsImport = async () => {
    setStatus({ type: 'loading', message: 'Importing from MLS Grid...' });

    try {
      const response = await fetch('/api/properties/import-mls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mlsNumber: mlsNumber.trim(),
          propertyType: mlsPropertyType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import property');
      }

      setStatus({
        type: 'success',
        message: `✅ Property imported! ${data.photosCount} photos added.`,
      });

      setMlsNumber('');
      setTimeout(() => setStatus({ type: 'idle', message: '' }), 3000);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Import failed',
      });
    }
  };

  // Handle URL Scrape
  const handleLinkScrape = async () => {
    setStatus({ type: 'loading', message: 'Scraping property data...' });

    try {
      const response = await fetch('/api/properties/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: linkUrl.trim(),
          propertyType: linkPropertyType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape property');
      }

      setStatus({
        type: 'success',
        message: `✅ Property scraped from ${data.source}! ${data.photosCount} photos added.`,
      });

      setLinkUrl('');
      setTimeout(() => setStatus({ type: 'idle', message: '' }), 3000);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Scraping failed',
      });
    }
  };

  // Handle Manual Entry
  const handleManualCreate = async () => {
    setStatus({ type: 'loading', message: 'Creating property...' });

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: manualForm.address,
          city: manualForm.city,
          state: manualForm.state,
          zip: manualForm.zip,
          price: manualForm.price ? parseFloat(manualForm.price) : null,
          bedrooms: manualForm.bedrooms ? parseInt(manualForm.bedrooms) : null,
          bathrooms: manualForm.bathrooms ? parseFloat(manualForm.bathrooms) : null,
          sqft: manualForm.sqft ? parseInt(manualForm.sqft) : null,
          public_remarks: manualForm.remarks,
          property_type: manualForm.propertyType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create property');
      }

      setStatus({
        type: 'success',
        message: '✅ Property created successfully!',
      });

      setManualForm({
        address: '',
        city: '',
        state: '',
        zip: '',
        price: '',
        bedrooms: '',
        bathrooms: '',
        sqft: '',
        remarks: '',
        propertyType: 'residential',
      });

      setTimeout(() => setStatus({ type: 'idle', message: '' }), 3000);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Creation failed',
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Upload Property</h2>

      {/* Status Message */}
      {status.type !== 'idle' && (
        <div
          className={`p-4 mb-6 rounded-lg flex items-center gap-2 ${
            status.type === 'success'
              ? 'bg-green-50 text-green-800'
              : status.type === 'error'
              ? 'bg-red-50 text-red-800'
              : 'bg-blue-50 text-blue-800'
          }`}
        >
          {status.type === 'loading' && <Loader className="h-4 w-4 animate-spin" />}
          {status.type === 'success' && <CheckCircle className="h-4 w-4" />}
          {status.type === 'error' && <AlertCircle className="h-4 w-4" />}
          <span>{status.message}</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mls">MLS Number</TabsTrigger>
          <TabsTrigger value="link">Paste Link</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        {/* MLS Import Tab */}
        <TabsContent value="mls" className="space-y-4">
          <div>
            <Label htmlFor="mls">MLS Number</Label>
            <Input
              id="mls"
              placeholder="e.g., 12345678"
              value={mlsNumber}
              onChange={(e) => setMlsNumber(e.target.value)}
              disabled={status.type === 'loading'}
            />
          </div>

          <div>
            <Label htmlFor="mls-type">Property Type</Label>
            <Select value={mlsPropertyType} onValueChange={(v: any) => setMlsPropertyType(v)}>
              <SelectTrigger id="mls-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="str">Short-Term Rental (STR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleMlsImport}
            disabled={!mlsNumber || status.type === 'loading'}
            className="w-full"
          >
            {status.type === 'loading' ? 'Importing...' : 'Import from MLS Grid'}
          </Button>
        </TabsContent>

        {/* Link Scrape Tab */}
        <TabsContent value="link" className="space-y-4">
          <div>
            <Label htmlFor="link-url">Property Link</Label>
            <Input
              id="link-url"
              placeholder="Paste Zillow, Redfin, or Realtor.com link"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              disabled={status.type === 'loading'}
              type="url"
            />
            <p className="text-sm text-gray-500 mt-2">
              Supports: zillow.com, redfin.com, realtor.com
            </p>
          </div>

          <div>
            <Label htmlFor="link-type">Property Type</Label>
            <Select value={linkPropertyType} onValueChange={(v: any) => setLinkPropertyType(v)}>
              <SelectTrigger id="link-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="str">Short-Term Rental (STR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleLinkScrape}
            disabled={!linkUrl || status.type === 'loading'}
            className="w-full"
          >
            {status.type === 'loading' ? 'Scraping...' : 'Scrape & Import'}
          </Button>
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manual-address">Address *</Label>
              <Input
                id="manual-address"
                placeholder="123 Main St"
                value={manualForm.address}
                onChange={(e) =>
                  setManualForm({ ...manualForm, address: e.target.value })
                }
                disabled={status.type === 'loading'}
              />
            </div>

            <div>
              <Label htmlFor="manual-city">City *</Label>
              <Input
                id="manual-city"
                placeholder="Austin"
                value={manualForm.city}
                onChange={(e) =>
                  setManualForm({ ...manualForm, city: e.target.value })
                }
                disabled={status.type === 'loading'}
              />
            </div>

            <div>
              <Label htmlFor="manual-state">State *</Label>
              <Input
                id="manual-state"
                placeholder="TX"
                maxLength={2}
                value={manualForm.state}
                onChange={(e) =>
                  setManualForm({ ...manualForm, state: e.target.value.toUpperCase() })
                }
                disabled={status.type === 'loading'}
              />
            </div>

            <div>
              <Label htmlFor="manual-zip">Zip</Label>
              <Input
                id="manual-zip"
                placeholder="78701"
                value={manualForm.zip}
                onChange={(e) =>
                  setManualForm({ ...manualForm, zip: e.target.value })
                }
                disabled={status.type === 'loading'}
              />
            </div>

            <div>
              <Label htmlFor="manual-price">Price</Label>
              <Input
                id="manual-price"
                placeholder="$500,000"
                value={manualForm.price}
                onChange={(e) =>
                  setManualForm({ ...manualForm, price: e.target.value })
                }
                disabled={status.type === 'loading'}
              />
            </div>

            <div>
              <Label htmlFor="manual-beds">Bedrooms</Label>
              <Input
                id="manual-beds"
                placeholder="3"
                type="number"
                value={manualForm.bedrooms}
                onChange={(e) =>
                  setManualForm({ ...manualForm, bedrooms: e.target.value })
                }
                disabled={status.type === 'loading'}
              />
            </div>

            <div>
              <Label htmlFor="manual-baths">Bathrooms</Label>
              <Input
                id="manual-baths"
                placeholder="2.5"
                type="number"
                step="0.5"
                value={manualForm.bathrooms}
                onChange={(e) =>
                  setManualForm({ ...manualForm, bathrooms: e.target.value })
                }
                disabled={status.type === 'loading'}
              />
            </div>

            <div>
              <Label htmlFor="manual-sqft">Sqft</Label>
              <Input
                id="manual-sqft"
                placeholder="2000"
                type="number"
                value={manualForm.sqft}
                onChange={(e) =>
                  setManualForm({ ...manualForm, sqft: e.target.value })
                }
                disabled={status.type === 'loading'}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="manual-remarks">Public Remarks</Label>
            <Textarea
              id="manual-remarks"
              placeholder="Property description..."
              rows={4}
              value={manualForm.remarks}
              onChange={(e) =>
                setManualForm({ ...manualForm, remarks: e.target.value })
              }
              disabled={status.type === 'loading'}
            />
          </div>

          <div>
            <Label htmlFor="manual-type">Property Type</Label>
            <Select
              value={manualForm.propertyType}
              onValueChange={(v: any) =>
                setManualForm({ ...manualForm, propertyType: v })
              }
            >
              <SelectTrigger id="manual-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="str">Short-Term Rental (STR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleManualCreate}
            disabled={
              !manualForm.address ||
              !manualForm.city ||
              !manualForm.state ||
              status.type === 'loading'
            }
            className="w-full"
          >
            {status.type === 'loading' ? 'Creating...' : 'Create Property'}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
