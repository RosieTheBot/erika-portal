/**
 * FubImportModal Component
 * Import buyers and sellers from Follow Up Boss
 * Features: search FUB contacts, preview, auto-fill form fields
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader, Search, Check, AlertCircle } from 'lucide-react';

interface FubContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  source?: string;
  tags?: string[];
}

interface FubImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport?: (contact: FubContact) => void;
  type: 'buyer' | 'seller';
}

export function FubImportModal({
  open,
  onOpenChange,
  onImport,
  type,
}: FubImportModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<FubContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<FubContact | null>(null);

  // Search FUB contacts
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        query: query.trim(),
        type,
      });

      const response = await fetch(`/api/fub/search?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setResults(data.contacts || []);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Error searching Follow Up Boss');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Handle import
  const handleImportContact = async (contact: FubContact) => {
    try {
      const response = await fetch('/api/fub/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact,
          type,
        }),
      });

      if (response.ok) {
        onImport?.(contact);
        onOpenChange(false);
        setSearchQuery('');
      } else {
        const data = await response.json();
        setError(data.error || 'Import failed');
      }
    } catch (err) {
      setError('Error importing contact');
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import from Follow Up Boss</DialogTitle>
          <DialogDescription>
            Search and import {type === 'buyer' ? 'buyers' : 'sellers'} from your FUB contacts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Results */}
          <ScrollArea className="flex-1 border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-600 text-sm">
                  {searchQuery ? 'No results found' : 'Start typing to search FUB contacts'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {results.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{contact.email}</p>
                        {contact.phone && (
                          <p className="text-xs text-gray-500 mt-1">{contact.phone}</p>
                        )}
                      </div>
                      <Check className="w-5 h-5 text-gray-300" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Selected Contact Preview */}
          {selectedContact && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-semibold text-gray-900">Selected Contact</p>
              <div className="bg-gray-50 p-3 rounded space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </span>
                </p>
                <p>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium">{selectedContact.email}</span>
                </p>
                {selectedContact.phone && (
                  <p>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium">{selectedContact.phone}</span>
                  </p>
                )}
                {selectedContact.city && (
                  <p>
                    <span className="text-gray-600">Location:</span>
                    <span className="ml-2 font-medium">
                      {selectedContact.city}, {selectedContact.state}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedContact && handleImportContact(selectedContact)}
              disabled={!selectedContact || loading}
            >
              {loading ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
