/**
 * PropertyDetailsPage Component
 * Full property view with engagement (comments, likes, shares)
 * Used by both admin and buyer portals
 */

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Heart,
  Trash2,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  DollarSign,
  Home,
  Share2,
  ArrowLeft,
  Loader,
} from 'lucide-react';

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
  lot_size: string;
  public_remarks: string;
  mls_number: string;
  source: string;
  property_photos: Array<{ id: string; photo_url: string; display_order: number }>;
  str_data?: {
    regulations: string;
    revenue_estimate: number;
    str_notes: string;
  };
  property_type: 'residential' | 'str';
  created_at: string;
}

interface Engagement {
  id: string;
  user_id: string;
  user_type: 'buyer' | 'admin' | 'seller';
  engagement_type: 'like' | 'trash' | 'comment';
  comment_text: string;
  created_at: string;
}

interface PropertyDetailsPageProps {
  propertyId: string;
  userId: string;
  userType: 'buyer' | 'admin';
  onBack?: () => void;
}

export function PropertyDetailsPage({
  propertyId,
  userId,
  userType,
  onBack,
}: PropertyDetailsPageProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [engagement, setEngagement] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [likes, setLikes] = useState(0);
  const [trashes, setTrashes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isTrashed, setIsTrashed] = useState(false);

  // Fetch property details
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const response = await fetch(`/api/properties/${propertyId}`);
        const data = await response.json();

        if (response.ok) {
          setProperty(data.property);
          setEngagement(data.engagement || []);

          // Count engagement
          const engagements = data.engagement || [];
          setLikes(engagements.filter((e: Engagement) => e.engagement_type === 'like').length);
          setTrashes(engagements.filter((e: Engagement) => e.engagement_type === 'trash').length);

          // Check if user already liked/trashed
          const userLike = engagements.find(
            (e: Engagement) =>
              e.user_id === userId &&
              e.user_type === userType &&
              e.engagement_type === 'like'
          );
          const userTrash = engagements.find(
            (e: Engagement) =>
              e.user_id === userId &&
              e.user_type === userType &&
              e.engagement_type === 'trash'
          );

          setIsLiked(!!userLike);
          setIsTrashed(!!userTrash);
        }
      } catch (error) {
        console.error('Error fetching property:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [propertyId, userId, userType]);

  // Handle engagement
  const handleLike = async () => {
    try {
      await fetch(`/api/properties/${propertyId}/engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userType,
          engagementType: 'like',
        }),
      });

      if (isLiked) {
        setLikes(Math.max(0, likes - 1));
        setIsLiked(false);
      } else {
        setLikes(likes + 1);
        setIsLiked(true);
        if (isTrashed) {
          setTrashes(Math.max(0, trashes - 1));
          setIsTrashed(false);
        }
      }
    } catch (error) {
      console.error('Error liking property:', error);
    }
  };

  const handleTrash = async () => {
    try {
      await fetch(`/api/properties/${propertyId}/engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userType,
          engagementType: 'trash',
        }),
      });

      if (isTrashed) {
        setTrashes(Math.max(0, trashes - 1));
        setIsTrashed(false);
      } else {
        setTrashes(trashes + 1);
        setIsTrashed(true);
        if (isLiked) {
          setLikes(Math.max(0, likes - 1));
          setIsLiked(false);
        }
      }
    } catch (error) {
      console.error('Error trashing property:', error);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    setCommenting(true);

    try {
      const response = await fetch(`/api/properties/${propertyId}/engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userType,
          engagementType: 'comment',
          commentText: commentText.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEngagement([data.engagement, ...engagement]);
        setCommentText('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setCommenting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Property not found</p>
        {onBack && (
          <Button onClick={onBack} variant="outline" className="mt-4">
            Go Back
          </Button>
        )}
      </div>
    );
  }

  const photos = property.property_photos || [];
  const currentPhoto = photos[photoIndex]?.photo_url;
  const comments = engagement.filter((e) => e.engagement_type === 'comment');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      {onBack && (
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      )}

      {/* Photo Gallery */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
        {currentPhoto ? (
          <Image
            src={currentPhoto}
            alt={property.address}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <Home className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Navigation */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPhotoIndex((prev) => (prev + 1) % photos.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm font-semibold">
              {photoIndex + 1} / {photos.length}
            </div>
          </>
        )}

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-4 flex gap-2 max-w-xs overflow-x-auto">
            {photos.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => setPhotoIndex(idx)}
                className={`w-12 h-12 rounded border-2 overflow-hidden flex-shrink-0 transition ${
                  idx === photoIndex ? 'border-white' : 'border-gray-400'
                }`}
              >
                <Image
                  src={photo.photo_url}
                  alt={`Photo ${idx + 1}`}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h1 className="text-3xl font-bold text-gray-900">
                {formatPrice(property.price)}
              </h1>
              {property.price_per_sqft > 0 && (
                <span className="text-gray-600">${property.price_per_sqft.toFixed(0)}/sqft</span>
              )}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-gray-900">{property.address}</h2>
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>
                  {property.city}, {property.state} {property.zip}
                </span>
              </div>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-2xl font-bold text-gray-900">{property.bedrooms}</p>
              <p className="text-sm text-gray-600">Bedrooms</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{property.bathrooms}</p>
              <p className="text-sm text-gray-600">Bathrooms</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {property.sqft ? (property.sqft / 1000).toFixed(1) : 'N/A'}
              </p>
              <p className="text-sm text-gray-600">K Sqft</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {property.property_type === 'str' ? 'STR' : 'Residential'}
              </p>
              <p className="text-sm text-gray-600">Type</p>
            </div>
          </div>

          {/* Details */}
          {property.lot_size && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Lot Size</h3>
              <p className="text-gray-700">{property.lot_size}</p>
            </div>
          )}

          {property.public_remarks && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{property.public_remarks}</p>
            </div>
          )}

          {/* STR Data */}
          {property.property_type === 'str' && property.str_data && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-blue-900">STR Information</h3>

              {property.str_data.revenue_estimate && (
                <div>
                  <p className="text-sm text-blue-700">Annual Revenue Estimate</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatPrice(property.str_data.revenue_estimate)}
                  </p>
                </div>
              )}

              {property.str_data.regulations && (
                <div>
                  <p className="text-sm text-blue-700 font-semibold">Local Regulations</p>
                  <p className="text-blue-900">{property.str_data.regulations}</p>
                </div>
              )}

              {property.str_data.str_notes && (
                <div>
                  <p className="text-sm text-blue-700 font-semibold">Notes</p>
                  <p className="text-blue-900">{property.str_data.str_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Engagement Buttons */}
          <div className="flex gap-2 border-t pt-4">
            <Button
              onClick={handleLike}
              variant={isLiked ? 'default' : 'outline'}
              className={isLiked ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {likes > 0 && <span>{likes}</span>}
            </Button>

            <Button
              onClick={handleTrash}
              variant={isTrashed ? 'default' : 'outline'}
              className={isTrashed ? 'bg-gray-500 hover:bg-gray-600' : ''}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {trashes > 0 && <span>{trashes}</span>}
            </Button>

            <Button variant="outline" className="ml-auto">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Comments Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Comments ({comments.length})
            </h3>

            {/* Comment Form */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-3">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={commenting}
                rows={3}
              />
              <Button
                onClick={handleComment}
                disabled={!commentText.trim() || commenting}
                className="w-full md:w-auto"
              >
                {commenting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-gray-900">
                        {comment.user_type === 'admin' ? '👤 Agent' : '👤 You'}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(comment.created_at)}</p>
                    </div>
                    <p className="text-gray-700">{comment.comment_text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Property Info Card */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-gray-900">Property Info</h3>

            {property.mls_number && (
              <div>
                <p className="text-xs text-gray-600 uppercase">MLS Number</p>
                <p className="font-semibold text-gray-900">{property.mls_number}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-600 uppercase">Source</p>
              <p className="font-semibold text-gray-900">{property.source}</p>
            </div>

            <div>
              <p className="text-xs text-gray-600 uppercase">Listed</p>
              <p className="font-semibold text-gray-900">{formatDate(property.created_at)}</p>
            </div>
          </div>

          {/* CTA */}
          {userType === 'buyer' && (
            <Button className="w-full" size="lg">
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Agent
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
