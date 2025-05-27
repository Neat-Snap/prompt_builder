'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Wrench, 
  Play, 
  GitBranch,
  Menu,
  X
} from 'lucide-react';
import { ProjectDashboard } from './ProjectDashboard';
import { PromptsConstructor } from './PromptsConstructor';
import { PromptTesting } from './PromptTesting';
import { VersionControl } from './VersionControl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { promptsApi } from '@/lib/api';
import { NewPromptDialog } from './NewPromptDialog';
import { PromptPlayground } from './PromptPlayground';
import { PromptTestSuite } from './PromptTestSuite';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ProjectPageProps {
  projectId: string;
}

type ProjectView = 'dashboard' | 'constructor' | 'playground' | 'testing' | 'versions';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'constructor', label: 'Prompt Constructor', icon: Wrench },
  { id: 'playground', label: 'Playground', icon: Play },
  { id: 'testing', label: 'Testing', icon: Play },
  { id: 'versions', label: 'Version Control', icon: GitBranch },
];

export function ProjectPage({ projectId }: ProjectPageProps) {
  const [activeView, setActiveView] = useState<ProjectView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPromptDialogOpen, setNewPromptDialogOpen] = useState(false);

  const fetchPrompts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await promptsApi.list(projectId);
      setPrompts(res.data);
      if (res.data.length > 0 && !selectedPromptId) {
        setSelectedPromptId(res.data[0].id);
      }
    } catch (err) {
      setError('Failed to load prompts.');
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [projectId]);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <ProjectDashboard projectId={projectId} />;
      case 'constructor':
        return <PromptsConstructor projectId={projectId} promptId={selectedPromptId} />;
      case 'playground':
        return <PromptPlayground projectId={projectId} promptId={selectedPromptId} />;
      case 'testing':
        return <PromptTestSuite projectId={projectId} promptId={selectedPromptId} />;
      case 'versions':
        return <VersionControl projectId={projectId} promptId={selectedPromptId} />;
      default:
        return <ProjectDashboard projectId={projectId} />;
    }
  };

  if (loading) return <div className="p-8 text-center">Loading prompts...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className={`bg-card border-r transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            {sidebarOpen && (
              <h2 className="text-lg font-semibold">Project Menu</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </Button>
          </div>
          {/* Prompt Selector inside menu section */}
          {sidebarOpen && (
            <div className="mb-6">
              <div className="font-semibold text-xs text-muted-foreground mb-2">Active Prompt</div>
              <div className="flex items-center space-x-2 mb-2">
                <Select value={selectedPromptId ?? ''} onValueChange={setSelectedPromptId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a prompt" />
                  </SelectTrigger>
                  <SelectContent>
                    {prompts.map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id}>
                        {prompt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setNewPromptDialogOpen(true)}
              >
                New Prompt
              </Button>
            </div>
          )}
          
          {/* Navigation */}
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={activeView === item.id ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveView(item.id as ProjectView)}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {sidebarOpen && item.label}
              </Button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>

      <NewPromptDialog
        open={newPromptDialogOpen}
        onOpenChange={setNewPromptDialogOpen}
        projectId={projectId}
        onPromptCreated={fetchPrompts}
      />
    </div>
  );
}