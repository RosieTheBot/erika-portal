/**
 * Webhook: Document Approved
 * Triggered when admin approves a seller's document
 */

import { createClient } from '@supabase/supabase-js';
import { emailService } from '@/lib/email-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export async function POST(_request: Request) {
  try {
    const body = await _request.json();
    const { documentId, propertyId, buyerEmail, buyerName, documentName } = body;

    if (!documentId || !propertyId) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get document URL from Supabase
    const { data: document } = await supabase
      .from('documents')
      .select('file_url, visibility')
      .eq('id', documentId)
      .single();

    if (!document) {
      return Response.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Send email to buyer if visibility is 'public'
    if (document.visibility === 'public' && buyerEmail) {
      await emailService.sendDocumentApproval(
        buyerEmail,
        buyerName || 'Buyer',
        {
          name: documentName,
          url: document.file_url,
        }
      );
    }

    // Create notification for buyer
    await supabase
      .from('notifications')
      .insert({
        user_id: null, // Will be filled by property owner
        type: 'document_approved',
        title: `Document Approved: ${documentName}`,
        message: `${documentName} has been approved and is now available.`,
        property_id: propertyId,
        metadata: {
          documentId,
          documentName,
          documentUrl: document.file_url,
        },
      });

    return Response.json({
      success: true,
      message: 'Document approval notification sent',
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
