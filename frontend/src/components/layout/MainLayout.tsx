'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X, Home, FolderOpen } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { HomePage } from '@/components/dashboard/HomePage';
import { ProjectPage } from '@/components/project/ProjectPage';

export function MainLayout() {
  const { tabs, activeTabId, setActiveTab, removeTab } = useAppStore();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Tab Bar */}
      <div className="border-b bg-muted/60 shadow-sm">
        <div className="flex items-center px-6 py-2">
          <div className="flex items-center space-x-2 flex-1 overflow-x-auto">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center space-x-2 px-4 py-2 rounded-t-md text-sm whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
                  activeTabId === tab.id
                    ? 'bg-background border-primary text-primary font-semibold shadow-sm'
                    : 'border-transparent hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                }`}
                onClick={() => setActiveTab(tab.id)}
                style={{ marginRight: 2 }}
              >
                {tab.type === 'home' ? (
                  <Home size={16} />
                ) : (
                  <FolderOpen size={16} />
                )}
                <span>{tab.title}</span>
                {tab.isClosable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTab(tab.id);
                    }}
                  >
                    <X size={12} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`h-full ${activeTabId === tab.id ? 'block' : 'hidden'}`}
          >
            {tab.type === 'home' ? (
              <HomePage />
            ) : (
              <ProjectPage projectId={tab.projectId!} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}