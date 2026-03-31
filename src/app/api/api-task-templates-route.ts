/**
 * API Route: /api/task-templates/[templateId]
 * Get task template with calculated due dates
 * ?contractDate=2026-04-01&closingDate=2026-04-28
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export async function GET(
  _request: Request,
  { params }: { params: { templateId: string } }
) {
  try {
    const url = new URL(request.url);
    const contractDateStr = url.searchParams.get('contractDate');
    const closingDateStr = url.searchParams.get('closingDate');

    if (!contractDateStr || !closingDateStr) {
      return Response.json(
        { error: 'contractDate and closingDate query parameters are required' },
        { status: 400 }
      );
    }

    // Fetch template from database
    const { data: template, error: templateError } = await supabase
      .from('task_templates')
      .select('*')
      .eq('id', params.templateId)
      .single();

    if (templateError || !template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    // Parse dates
    const contractDate = new Date(contractDateStr);
    const closingDate = new Date(closingDateStr);

    // Calculate due dates for all tasks
    const tasks = (template.tasks_data || []).map((task: any) => {
      let dueDate: Date | null = null;

      if (task.offsetFrom === 'contractDate') {
        dueDate = new Date(contractDate);
        dueDate.setDate(dueDate.getDate() + task.daysOffset);
      } else if (task.offsetFrom === 'closingDate') {
        dueDate = new Date(closingDate);
        dueDate.setDate(dueDate.getDate() + task.daysOffset);
      }

      return {
        ...task,
        dueDate: dueDate ? dueDate.toISOString().split('T')[0] : null,
      };
    });

    return Response.json({
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        taskCount: template.task_count,
      },
      tasks,
      contractDate: contractDateStr,
      closingDate: closingDateStr,
    });

  } catch (error) {
    console.error('Error fetching template:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
