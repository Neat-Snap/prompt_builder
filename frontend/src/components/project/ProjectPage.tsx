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

interface ProjectPageProps {
  projectId: string;
}

type ProjectView = 'dashboard' | 'constructor' | 'testing' | 'versions';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'constructor', label: 'Prompt Constructor', icon: Wrench },
  { id: 'testing', label: 'Testing Panel', icon: Play },
  { id: 'versions', label: 'Version Control', icon: GitBranch },
];

export function ProjectPage({ projectId }: ProjectPageProps) {
  const [activeView, setActiveView] = useState<ProjectView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPromptId, setSelectedPromptId] = useState('prompt-1');
  const [prompts, setPrompts] = useState([
    { id: 'prompt-1', name: 'Customer Support V3' },
    { id: 'prompt-2', name: 'Product Description Generator' },
    { id: 'prompt-3', name: 'Email Response Template' },
  ]);

  useEffect(() => {
    setPrompts([
      { id: 'prompt-1', name: 'Customer Support V3' },
      { id: 'prompt-2', name: 'Product Description Generator' },
      { id: 'prompt-3', name: 'Email Response Template' },
    ]);
  }, [projectId]);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <ProjectDashboard projectId={projectId} />;
      case 'constructor':
        return <PromptsConstructor projectId={projectId} />;
      case 'testing':
        return <PromptTesting projectId={projectId} />;
      case 'versions':
        return <VersionControl projectId={projectId} />;
      default:
        return <ProjectDashboard projectId={projectId} />;
    }
  };

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
                <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
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
              <Button variant="outline" size="sm" className="w-full">New Prompt</Button>
            </div>
          )}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeView === item.id ? 'default' : 'ghost'}
                  className={`w-full justify-start ${!sidebarOpen && 'px-2'}`}
                  onClick={() => setActiveView(item.id as ProjectView)}
                >
                  <Icon size={16} className={sidebarOpen ? 'mr-2' : ''} />
                  {sidebarOpen && item.label}
                </Button>
              );
            })}
          </nav>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 pb-6 pt-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}