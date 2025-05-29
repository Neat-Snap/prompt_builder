'use client';

import { useAppStore } from '@/lib/store';
import { HomePage } from '@/components/dashboard/HomePage';
import { ProjectPage } from '@/components/project/ProjectPage';

export function MainLayout() {
  const { currentView } = useAppStore();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Only one view at a time: Home or Project */}
      <div className="flex-1 overflow-hidden">
        {currentView.type === 'home' ? (
          <HomePage />
        ) : (
          <ProjectPage projectId={currentView.projectId} />
        )}
      </div>
    </div>
  );
}