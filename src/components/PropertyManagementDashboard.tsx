/**
 * PropertyManagementDashboard Component
 * Lists all properties with filters, search, and quick actions
 * Features: search, filter by status/type, pagination, edit/delete/assign
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit2, Trash2, Users, Eye, DollarSign, Home } from 'lucide-react';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  price_per_sqft: number;
  mls_number: string;
  source: string;
  property_type: 'residential' | 'str';
  status: 'available' | 'under_contract' | 'sold';
  created_at: string;
  property_photos: Array<{ id: string; photo_url: string }>;
}

export function PropertyManagementDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Fetch properties
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });

      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const response = await fetch(`/api/properties?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setProperties(data.properties);
        setTotalCount(data.total);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [search, statusFilter, typeFilter, pagination]);

  // Format currency
  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTargetId) return;

    try {
      const response = await fetch('/api/properties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTargetId }),
      });

      if (response.ok) {
        setProperties(properties.filter((p) => p.id !== deleteTargetId));
        setDeleteDialogOpen(false);
        setDeleteTargetId(null);
      }
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  // Status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'under_contract':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Type badge color
  const getTypeBadgeColor = (type: string) => {
    return type === 'str' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  const totalPages = Math.ceil(totalCount / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by address, city, or MLS number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination({ ...pagination, offset: 0 });
            }}
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="under_contract">Under Contract</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="str">Short-Term Rental</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Properties Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Beds/Baths</TableHead>
              <TableHead className="text-right">Sqft</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading properties...
                </TableCell>
              </TableRow>
            ) : properties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No properties found
                </TableCell>
              </TableRow>
            ) : (
              properties.map((property) => (
                <TableRow key={property.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {property.property_photos && property.property_photos.length > 0 ? (
                        <img
                          src={property.property_photos[0].photo_url}
                          alt={property.address}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                          <Home className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p>{property.address}</p>
                        <p className="text-sm text-gray-500">
                          {property.city}, {property.state} {property.zip}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(property.price)}
                  </TableCell>
                  <TableCell className="text-center">
                    {property.bedrooms} / {property.bathrooms}
                  </TableCell>
                  <TableCell className="text-right">
                    {property.sqft?.toLocaleString() || 'N/A'} sq ft
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                        property.status
                      )}`}
                    >
                      {property.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeBadgeColor(
                        property.property_type
                      )}`}
                    >
                      {property.property_type === 'str' ? 'STR' : 'Residential'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{property.source}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        title="View details"
                        onClick={() => {
                          // Navigate to property details page
                          window.location.href = `/properties/${property.id}`;
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        title="Edit"
                        onClick={() => {
                          // Navigate to edit page
                          window.location.href = `/properties/${property.id}/edit`;
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        title="Assign to buyer"
                        onClick={() => {
                          // Open assign dialog
                          window.location.href = `/properties/${property.id}/assign`;
                        }}
                      >
                        <Users className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                        onClick={() => {
                          setDeleteTargetId(property.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {properties.length === 0 ? 0 : pagination.offset + 1} to{' '}
          {Math.min(pagination.offset + pagination.limit, totalCount)} of {totalCount} properties
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() =>
              setPagination({
                ...pagination,
                offset: Math.max(0, pagination.offset - pagination.limit),
              })
            }
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setPagination({
                    ...pagination,
                    offset: (page - 1) * pagination.limit,
                  })
                }
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() =>
              setPagination({
                ...pagination,
                offset: pagination.offset + pagination.limit,
              })
            }
          >
            Next
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Property?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The property and all related data will be permanently
            deleted.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
