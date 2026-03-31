/**
 * SellerUnderContractPortal Component
 * 31-task timeline from contract to closing
 * Seller view: see task progress, upload documents, track timeline
 * Auto-calculates all task due dates from contract/closing dates
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Clock,
  Calendar,
  FileUp,
  AlertCircle,
  Loader,
} from 'lucide-react';

interface Task {
  index: number;
  title: string;
  description: string;
  daysOffset: number;
  offsetFrom: 'contractDate' | 'closingDate';
  category: string;
  priority: 'high' | 'medium' | 'low';
  type: 'action' | 'deadline' | 'date_marker';
  dueDate?: string;
  completed?: boolean;
  completedAt?: string;
}

interface SellerUnderContractPortalProps {
  sellerId: string;
  propertyAddress: string;
  contractDate: string;
  closingDate: string;
  onTaskComplete?: (taskIndex: number) => void;
}

export function SellerUnderContractPortal({
  sellerId,
  propertyAddress,
  contractDate,
  closingDate,
  onTaskComplete,
}: SellerUnderContractPortalProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch task template and calculate due dates
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(
          `/api/task-templates/seller_under_contract?contractDate=${contractDate}&closingDate=${closingDate}`
        );
        const data = await response.json();

        if (response.ok) {
          setTasks(data.tasks);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (contractDate && closingDate) {
      fetchTasks();
    }
  }, [contractDate, closingDate]);

  // Calculate progress
  const completedTasks = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Group tasks by category
  const tasksByCategory = tasks.reduce(
    (acc, task) => {
      const category = task.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(task);
      return acc;
    },
    {} as Record<string, Task[]>
  );

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Check if task is overdue
  const isOverdue = (task: Task) => {
    if (task.completed || !task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Transaction Timeline</h1>
        <p className="text-gray-600">{propertyAddress}</p>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progress</span>
            <span className="text-2xl font-bold text-blue-600">{progressPercent}%</span>
          </CardTitle>
          <CardDescription>
            {completedTasks} of {tasks.length} tasks completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Key Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Contract Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatDate(contractDate)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Closing Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatDate(closingDate)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Task Timeline */}
      <div className="space-y-6">
        {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
          <div key={category} className="space-y-3">
            <h2 className="font-semibold text-gray-900 text-lg border-b pb-2">{category}</h2>

            <div className="space-y-2">
              {categoryTasks.map((task) => (
                <button
                  key={task.index}
                  onClick={() => setSelectedTask(task)}
                  className={`w-full p-4 rounded-lg border text-left transition ${
                    task.completed
                      ? 'bg-green-50 border-green-200'
                      : isOverdue(task)
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className="pt-1">
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : task.type === 'date_marker' ? (
                        <Calendar className="w-5 h-5 text-blue-600" />
                      ) : isOverdue(task) ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>

                      <div className="flex items-center gap-4 mt-2">
                        {task.dueDate && (
                          <span className="text-xs text-gray-500">
                            Due: {formatDate(task.dueDate)}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>

                    {/* Completed Badge */}
                    {task.completed && (
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">
                        Done
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          propertyAddress={propertyAddress}
          onClose={() => setSelectedTask(null)}
          onUpload={() => {
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}

// Task Details Modal Component
function TaskDetailsModal({
  task,
  propertyAddress,
  onClose,
  onUpload,
}: {
  task: Task;
  propertyAddress: string;
  onClose: () => void;
  onUpload: () => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      // TODO: Implement document upload to /api/documents
      // await uploadDocument(files[0], taskId)
      onUpload();
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>{propertyAddress}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Details</h3>
            <p className="text-gray-700">{task.description}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold">Due Date</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(task.dueDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase font-semibold">Priority</p>
              <p className="text-lg font-semibold capitalize text-gray-900">{task.priority}</p>
            </div>
          </div>

          {/* Document Upload */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileUp className="w-4 h-4" />
              Upload Documents
            </h3>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <label className="cursor-pointer">
                <div className="space-y-2">
                  <FileUp className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-sm font-medium text-gray-700">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, images, or documents up to 50MB
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {uploading && (
              <div className="mt-2 flex items-center gap-2 text-blue-600">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Uploading...</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end border-t pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
