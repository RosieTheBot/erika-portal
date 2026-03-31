/**
 * API Route: /api/email/send
 * Send emails via Gmail SMTP
 */

import { emailService } from '@/lib/email-service';

export async function POST(_request: Request) {
  try {
    const body = await _request.json();
    const { recipientEmail, recipientName, type, data } = body;

    if (!recipientEmail || !type) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let result = false;

    switch (type) {
      case 'task_reminder':
        result = await emailService.sendTaskReminder(recipientEmail, recipientName, data);
        break;
      case 'status_update':
        result = await emailService.sendStatusUpdate(recipientEmail, recipientName, data);
        break;
      case 'document_approval':
        result = await emailService.sendDocumentApproval(recipientEmail, recipientName, data);
        break;
      case 'closing_reminder':
        result = await emailService.sendClosingReminder(recipientEmail, recipientName, data);
        break;
      default:
        return Response.json(
          { error: 'Unknown email type' },
          { status: 400 }
        );
    }

    if (!result) {
      return Response.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Email sent successfully',
      recipient: recipientEmail,
    });
  } catch (error) {
    console.error('Email send error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
