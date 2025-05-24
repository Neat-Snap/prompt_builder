'use client';

import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAppStore } from '@/lib/store';

// Test user and project data
const testUser = {
  id: 'test-user-1',
  email: 'testuser@example.com',
  name: 'Test User',
  avatar: undefined,
};

const testProjects = [
  {
    id: 'project-1',
    name: 'AI Prompt Playground',
    description: 'Test and compare prompts across models',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-04-01'),
    promptCount: 12,
    testCount: 58,
    lastActivity: new Date('2024-04-01'),
  },
  {
    id: 'project-2',
    name: 'Customer Support Bot',
    description: 'Prompt engineering for support automation',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-04-02'),
    promptCount: 7,
    testCount: 31,
    lastActivity: new Date('2024-04-02'),
  },
];

export default function Home() {
  const { setUser, setProjects } = useAppStore();

  useEffect(() => {
    setUser(testUser);
    setProjects(testProjects);
  }, [setUser, setProjects]);

  return <MainLayout />;
}