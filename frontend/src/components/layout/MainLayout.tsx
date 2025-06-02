'use client';

import { useAppStore } from '@/lib/store';
import { HomePage } from '@/components/dashboard/HomePage';
import { ProjectPage } from '@/components/project/ProjectPage';
import { useEffect, useState } from 'react';
import { loadFromLocalStorage } from '@/lib/utils';

export function MainLayout() {
  const { currentView } = useAppStore();
  const [projectTabState, setProjectTabState] = useState<{ tab: string; promptId: string | null } | null>(null);

  useEffect(() => {
    if (currentView.type === 'project') {
      const key = `prompt_builder__projectTab__${currentView.projectId}`;
      const state = loadFromLocalStorage<{ tab: string; promptId: string | null }>(key, { tab: 'dashboard', promptId: null });
      setProjectTabState(state);
    } else {
      setProjectTabState(null);
    }
  }, [currentView]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Only one view at a time: Home or Project */}
      <div className="flex-1 overflow-hidden">
        {currentView.type === 'home' ? (
          <HomePage />
        ) : (
          <ProjectPage projectId={currentView.projectId} initialTab={projectTabState?.tab} initialPromptId={projectTabState?.promptId} />
        )}
      </div>
    </div>
  );
}