/**
 * API Route: /api/properties/[propertyId]/engagement
 * Engagement endpoints: like, trash, comment
 * GET - Get all engagement for property
 * POST - Add engagement (like, trash, comment)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// GET /api/properties/[propertyId]/engagement
export async function GET(
  __request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { data, error } = await supabase
      .from('property_engagement')
      .select('*')
      .eq('property_id', params.propertyId)
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Aggregate engagement stats
    const likes = data.filter((e) => e.engagement_type === 'like').length;
    const trashes = data.filter((e) => e.engagement_type === 'trash').length;
    const comments = data.filter((e) => e.engagement_type === 'comment');

    return Response.json({
      engagement: data,
      stats: {
        likes,
        trashes,
        commentCount: comments.length,
      },
    });

  } catch (error) {
    console.error('Error fetching engagement:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/properties/[propertyId]/engagement
export async function POST(
  _request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const body = await request.json();
    const { userId, userType, engagementType, commentText } = body;

    if (!userId || !userType || !engagementType) {
      return Response.json(
        { error: 'userId, userType, and engagementType are required' },
        { status: 400 }
      );
    }

    if (!['like', 'trash', 'comment'].includes(engagementType)) {
      return Response.json(
        { error: 'engagementType must be like, trash, or comment' },
        { status: 400 }
      );
    }

    if (engagementType === 'comment' && !commentText) {
      return Response.json(
        { error: 'commentText is required for comment type' },
        { status: 400 }
      );
    }

    // Check if like/trash already exists (prevent duplicates)
    if (['like', 'trash'].includes(engagementType)) {
      const { data: existing } = await supabase
        .from('property_engagement')
        .select('id')
        .eq('property_id', params.propertyId)
        .eq('user_id', userId)
        .eq('user_type', userType)
        .eq('engagement_type', engagementType)
        .single()
        .catch(() => ({ data: null }));

      if (existing) {
        // Delete if already exists (toggle off)
        await supabase
          .from('property_engagement')
          .delete()
          .eq('id', existing.id);

        return Response.json({
          success: true,
          action: 'removed',
          engagementType,
        });
      }
    }

    const { data, error } = await supabase
      .from('property_engagement')
      .insert([
        {
          property_id: params.propertyId,
          user_id: userId,
          user_type: userType,
          engagement_type: engagementType,
          comment_text: commentText || null,
        },
      ])
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      action: 'added',
      engagement: data,
    });

  } catch (error) {
    console.error('Error creating engagement:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/properties/[propertyId]/engagement/[engagementId]
export async function DELETE(
  _request: Request,
  { params }: { params: { propertyId: string; engagementId: string } }
) {
  try {
    const { error } = await supabase
      .from('property_engagement')
      .delete()
      .eq('id', params.engagementId)
      .eq('property_id', params.propertyId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Engagement removed' });

  } catch (error) {
    console.error('Error deleting engagement:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
