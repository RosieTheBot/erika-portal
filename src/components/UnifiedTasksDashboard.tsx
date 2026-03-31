/**
 * UnifiedTasksDashboard Component
 * View and manage all tasks across all deals
 * Admin view: see everything, filter, mark complete
 * Features: search, filter by property/status/priority, sorting, bulk actions
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader,
  Flag,
  Calendar,
  Filter,
} from 'lucide-react';

interface Task {
  id: string;
  property_id: string;
  propertyAddress: string;
  seller_id?: string;
  sellerName?: string;
  buyer_id?: string;
  buyerName?: string;
  task_name: string;
  task_description?: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  completed_at?: string;
}

interface UnifiedTasksDashboardProps {
  adminId: string;
}

export function UnifiedTasksDashboard({ adminId }: UnifiedTasksDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('due_date');

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: '100',
        });

        if (search) params.append('search', search);
        if (statusFilter) params.append('status', statusFilter);
        if (priorityFilter) params.append('priority', priorityFilter);
        params.append('sort', sortBy);

        const response = await fetch(`/api/admin/tasks?${params.toString()}`);
        const data = await response.json();

        if (response.ok) {
          setTasks(data.tasks || []);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [search, statusFilter, priorityFilter, sortBy]);

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if task is overdue
  const isOverdue = (task: Task) => {
    if (task.status === 'completed' || !task.due_date) return false;
    return new Date(task.due_date) < new Date();
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  // Toggle task selection
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Handle mark complete
  const handleMarkComplete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (response.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: 'completed' as const, completed_at: new Date().toISOString() }
              : t
          )
        );
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Get task stats
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    overdue: tasks.filter((t) => isOverdue(t)).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Tasks</h1>
        <p className="text-gray-600 mt-1">Manage tasks across all properties</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-600 uppercase font-semibold">Total Tasks</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-700 uppercase font-semibold">Completed</p>
          <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-700 uppercase font-semibold">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-700 uppercase font-semibold">Overdue</p>
          <p className="text-2xl font-bold text-red-700">{stats.overdue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search tasks, properties, people..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="due_date">Due Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="created_at">Created</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTasks.length === tasks.length && tasks.length > 0}
                  onCheckedChange={(checked) =>
                    setSelectedTasks(checked ? tasks.map((t) => t.id) : [])
                  }
                />
              </TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-center">Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className={
                    task.status === 'completed'
                      ? 'bg-green-50'
                      : isOverdue(task)
                      ? 'bg-red-50'
                      : ''
                  }
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={() => toggleTaskSelection(task.id)}
                    />
                  </TableCell>

                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{task.task_name}</p>
                      {task.task_description && (
                        <p className="text-xs text-gray-500 mt-1">{task.task_description}</p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-sm text-gray-600">{task.propertyAddress}</TableCell>

                  <TableCell className="text-sm text-gray-600">
                    {task.sellerName || task.buyerName || '—'}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{formatDate(task.due_date)}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <Flag className={`w-4 h-4 ${getPriorityColor(task.priority)} mx-auto`} />
                  </TableCell>

                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor(task.status)}`}>
                      {task.status === 'in_progress' ? 'In Progress' : task.status}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    {task.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkComplete(task.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Done
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
          </p>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline">
              Assign
            </Button>
            <Button size="sm" variant="outline">
              Change Priority
            </Button>
            <Button size="sm" variant="outline" className="text-red-600">
              Archive
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
