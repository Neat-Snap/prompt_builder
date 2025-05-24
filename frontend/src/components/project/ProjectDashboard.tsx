'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  Zap, 
  TrendingUp, 
  MessageSquare,
  DollarSign,
  Target
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { projectsApi, promptsApi } from '@/lib/api';

interface ProjectDashboardProps {
  projectId: string;
}

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const [projectStats, setProjectStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const [projectRes, promptsRes] = await Promise.all([
          projectsApi.get(projectId),
          promptsApi.list(projectId),
        ]);
        setProjectStats({
          ...projectRes.data,
          totalPrompts: promptsRes.data.length,
        });
      } catch (e) {
        setError('Failed to load project stats.');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [projectId]);

  if (loading) return <div className="p-8 text-center">Loading project stats...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const recentActivity = [
    { id: 1, action: 'Prompt "Customer Support V3" tested with GPT-4', time: '2 min ago', status: 'success' },
    { id: 2, action: 'New prompt "Product Description" created', time: '15 min ago', status: 'info' },
    { id: 3, action: 'Prompt "Email Generator" updated to v2.1', time: '1 hour ago', status: 'info' },
    { id: 4, action: 'Test failed for "Code Review" prompt', time: '2 hours ago', status: 'error' },
  ];

  const topModels = [
    { name: 'GPT-4', usage: 145, cost: 8.32, successRate: 98.1 },
    { name: 'Claude-3.5', usage: 89, cost: 2.14, successRate: 96.7 },
    { name: 'GPT-3.5-Turbo', usage: 67, cost: 1.22, successRate: 94.2 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Project Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your project performance and recent activity
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.totalPrompts}</div>
            <p className="text-xs text-muted-foreground">
              {projectStats.activePrompts} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Run</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.totalTests}</div>
            <p className="text-xs text-muted-foreground">
              {projectStats.testsToday} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.successRate}%</div>
            <Progress value={projectStats.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${projectStats.totalCost}</div>
            <p className="text-xs text-muted-foreground">
              Avg latency: {projectStats.avgLatency}s
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Models */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Model Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topModels.map((model, index) => (
                <div key={model.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{model.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {model.usage} tests • ${model.cost}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {model.successRate}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}