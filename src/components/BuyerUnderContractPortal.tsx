/**
 * BuyerUnderContractPortal Component
 * 27-task timeline from contract to closing + beyond
 * Buyer view: see transaction progress, upload documents, track timeline
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
  CheckCircle2,
  Clock,
  Calendar,
  FileUp,
  AlertCircle,
  Loader,
  Home,
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
}

interface BuyerUnderContractPortalProps {
  buyerId: string;
  propertyAddress: string;
  price: number;
  contractDate: string;
  closingDate: string;
  documents?: Array<{ id: string; name: string; url: string; visibility: string }>;
}

export function BuyerUnderContractPortal({
  buyerId,
  propertyAddress,
  price,
  contractDate,
  closingDate,
  documents = [],
}: BuyerUnderContractPortalProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');

  // Fetch buyer task template
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // For now, create a basic buyer timeline
        // In production, fetch from buyer_under_contract template
        const response = await fetch(
          `/api/task-templates/buyer_under_contract?contractDate=${contractDate}&closingDate=${closingDate}`
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

  // Days until closing
  const daysUntilClosing = Math.ceil(
    (new Date(closingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
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
        <div className="flex items-center gap-2">
          <Home className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Your Closing</h1>
        </div>
        <p className="text-gray-600">{propertyAddress}</p>
      </div>

      {/* Purchase Details Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-900">{formatPrice(price)}</CardTitle>
          <CardDescription className="text-blue-700">Purchase Price</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-blue-700 uppercase font-semibold">Closing In</p>
              <p className="text-2xl font-bold text-blue-900">
                {daysUntilClosing > 0 ? daysUntilClosing : 0} days
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-700 uppercase font-semibold">Closing Date</p>
              <p className="text-lg font-bold text-blue-900">{formatDate(closingDate)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-700 uppercase font-semibold">Progress</p>
              <p className="text-2xl font-bold text-blue-900">{progressPercent}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Timeline Progress</span>
            <span className="text-sm font-semibold text-gray-600">
              {completedTasks} / {tasks.length} tasks
            </span>
          </CardTitle>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4 mt-4">
          {tasks.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-gray-600">Loading timeline...</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card
                  key={task.index}
                  className={
                    task.completed
                      ? 'bg-green-50 border-green-200'
                      : 'hover:border-gray-400'
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Status Icon */}
                      <div className="pt-1">
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : task.type === 'date_marker' ? (
                          <Calendar className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-semibold ${
                            task.completed
                              ? 'text-gray-500 line-through'
                              : 'text-gray-900'
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>

                        <div className="flex items-center gap-3 mt-2">
                          {task.dueDate && (
                            <span className="text-xs text-gray-500">
                              📅 {formatDate(task.dueDate)}
                            </span>
                          )}
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-semibold ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4 mt-4">
          {documents.length === 0 ? (
            <Card className="p-6 text-center">
              <FileUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">No documents yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Documents will appear here as your agent uploads them
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileUp className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">Document</p>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-4 mt-4">
          <div className="space-y-3">
            <Card className="p-4">
              <p className="font-semibold text-gray-900 mb-2">What happens next?</p>
              <p className="text-sm text-gray-700">
                Your agent will guide you through each step. Check back often for updates and new documents.
              </p>
            </Card>

            <Card className="p-4">
              <p className="font-semibold text-gray-900 mb-2">When is final walkthrough?</p>
              <p className="text-sm text-gray-700">
                Your agent will schedule this 1-2 days before closing. You'll inspect the property one final time.
              </p>
            </Card>

            <Card className="p-4">
              <p className="font-semibold text-gray-900 mb-2">How long is closing?</p>
              <p className="text-sm text-gray-700">
                Typically 30-45 minutes. You'll sign documents at the title company, then keys are yours!
              </p>
            </Card>

            <Card className="p-4">
              <p className="font-semibold text-gray-900 mb-2">Questions?</p>
              <Button className="w-full mt-2">Message Your Agent</Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
