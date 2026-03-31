/**
 * Webhook: Task Reminders
 * Triggered daily to send email reminders for upcoming tasks
 * Can be called by cron job or external scheduler
 */

import { createClient } from '@supabase/supabase-js';
import { emailService } from '@/lib/email-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export async function POST(_request: Request) {
  try {
    // Verify webhook secret (for security)
    const authHeader = _request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tasks due in the next 2 days
    const today = new Date();
    const twoDaysLater = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

    const { data: upcomingTasks, error } = await supabase
      .from('tasks')
      .select(`
        id,
        task_name,
        task_description,
        due_date,
        property_id,
        properties (
          address,
          seller_id,
          buyer_id
        )
      `)
      .eq('status', 'pending')
      .gte('due_date', today.toISOString())
      .lte('due_date', twoDaysLater.toISOString());

    if (error) {
      console.error('Error fetching tasks:', error);
      return Response.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    if (!upcomingTasks || upcomingTasks.length === 0) {
      return Response.json({
        success: true,
        message: 'No upcoming tasks',
        tasksProcessed: 0,
      });
    }

    // Send reminders
    let sentCount = 0;
    for (const task of upcomingTasks) {
      const property = (task as any).properties;
      if (!property) continue;

      // Send to seller
      if (property.seller_id) {
        const { data: seller } = await supabase
          .from('sellers')
          .select('email, first_name')
          .eq('id', property.seller_id)
          .single();

        if (seller?.email) {
          const sent = await emailService.sendTaskReminder(
            seller.email,
            seller.first_name,
            {
              name: task.task_name,
              description: task.task_description,
              dueDate: task.due_date,
            }
          );
          if (sent) sentCount++;
        }
      }

      // Send to buyer
      if (property.buyer_id) {
        const { data: buyer } = await supabase
          .from('buyers')
          .select('email, first_name')
          .eq('id', property.buyer_id)
          .single();

        if (buyer?.email) {
          const sent = await emailService.sendTaskReminder(
            buyer.email,
            buyer.first_name,
            {
              name: task.task_name,
              description: task.task_description,
              dueDate: task.due_date,
            }
          );
          if (sent) sentCount++;
        }
      }
    }

    return Response.json({
      success: true,
      message: 'Task reminders sent',
      tasksProcessed: upcomingTasks.length,
      emailsSent: sentCount,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
