/**
 * Email Service - Nodemailer for Gmail SMTP
 * Sends task notifications, status updates, document approvals
 */

import nodemailer from 'nodemailer';

// Get Gmail credentials from environment
const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

interface EmailPayload {
  to: string;
  subject: string;
  template: 'task_reminder' | 'status_update' | 'document_approval' | 'closing_reminder';
  data: Record<string, any>;
}

// Email templates
const templates = {
  task_reminder: (data: any) => `
    <h2>Task Reminder: ${data.taskName}</h2>
    <p>Hi ${data.recipientName},</p>
    <p>You have a task due on <strong>${data.dueDate}</strong>:</p>
    <p><strong>${data.taskName}</strong></p>
    <p>${data.taskDescription}</p>
    <p><a href="${data.portalUrl}">View in Portal</a></p>
    <p>Thanks!</p>
  `,
  
  status_update: (data: any) => `
    <h2>Status Update: ${data.propertyAddress}</h2>
    <p>Hi ${data.recipientName},</p>
    <p>Your transaction status has been updated:</p>
    <p><strong>${data.previousStatus}</strong> → <strong>${data.newStatus}</strong></p>
    <p>${data.updateDetails}</p>
    <p><a href="${data.portalUrl}">View Full Details</a></p>
  `,
  
  document_approval: (data: any) => `
    <h2>Document Approved: ${data.documentName}</h2>
    <p>Hi ${data.recipientName},</p>
    <p>A document has been approved and is now available:</p>
    <p><strong>${data.documentName}</strong></p>
    <p><a href="${data.documentUrl}">Download Document</a></p>
  `,
  
  closing_reminder: (data: any) => `
    <h2>Closing Reminder</h2>
    <p>Hi ${data.recipientName},</p>
    <p>Your closing is scheduled for <strong>${data.closingDate}</strong> at <strong>${data.closingTime}</strong></p>
    <p>Property: ${data.propertyAddress}</p>
    <p>Location: ${data.closingLocation}</p>
    <p><a href="${data.portalUrl}">View Timeline</a></p>
  `,
};

export const emailService = {
  async sendEmail(payload: EmailPayload): Promise<boolean> {
    try {
      if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        console.warn('Gmail credentials not configured - email not sent');
        return false;
      }

      const htmlContent = templates[payload.template](payload.data);

      const mailOptions = {
        from: `Homebase <${GMAIL_USER}>`,
        to: payload.to,
        subject: payload.subject,
        html: htmlContent,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${payload.to}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error(`Error sending email to ${payload.to}:`, error);
      return false;
    }
  },

  async sendTaskReminder(recipientEmail: string, recipientName: string, task: any) {
    return this.sendEmail({
      to: recipientEmail,
      subject: `Task Reminder: ${task.name}`,
      template: 'task_reminder',
      data: {
        recipientName,
        taskName: task.name,
        taskDescription: task.description,
        dueDate: new Date(task.dueDate).toLocaleDateString(),
        portalUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://erika-portal.vercel.app',
      },
    });
  },

  async sendStatusUpdate(recipientEmail: string, recipientName: string, update: any) {
    return this.sendEmail({
      to: recipientEmail,
      subject: `Status Update: ${update.propertyAddress}`,
      template: 'status_update',
      data: {
        recipientName,
        propertyAddress: update.propertyAddress,
        previousStatus: update.previousStatus,
        newStatus: update.newStatus,
        updateDetails: update.details,
        portalUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://erika-portal.vercel.app',
      },
    });
  },

  async sendDocumentApproval(recipientEmail: string, recipientName: string, document: any) {
    return this.sendEmail({
      to: recipientEmail,
      subject: `Document Approved: ${document.name}`,
      template: 'document_approval',
      data: {
        recipientName,
        documentName: document.name,
        documentUrl: document.url,
        portalUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://erika-portal.vercel.app',
      },
    });
  },

  async sendClosingReminder(recipientEmail: string, recipientName: string, closing: any) {
    return this.sendEmail({
      to: recipientEmail,
      subject: `Closing Reminder - ${new Date(closing.date).toLocaleDateString()}`,
      template: 'closing_reminder',
      data: {
        recipientName,
        propertyAddress: closing.propertyAddress,
        closingDate: new Date(closing.date).toLocaleDateString(),
        closingTime: closing.time,
        closingLocation: closing.location,
        portalUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://erika-portal.vercel.app',
      },
    });
  },
};
