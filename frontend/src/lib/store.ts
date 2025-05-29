import { create } from 'zustand';
import { User, Project } from '@/types';

// New view type
export type AppView = { type: 'home' } | { type: 'project'; projectId: string };

interface AppState {
  user: User | null;
  projects: Project[];
  currentView: AppView;

  // Actions
  setUser: (user: User | null) => void;
  setProjects: (projects: Project[]) => void;
  goHome: () => void;
  openProject: (projectId: string) => void;
  updateProject: (project: Project) => void;
  removeProject: (projectId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  projects: [],
  currentView: { type: 'home' },

  setUser: (user) => set({ user }),
  setProjects: (projects) => set({ projects }),

  goHome: () => set({ currentView: { type: 'home' } }),
  openProject: (projectId) => set({ currentView: { type: 'project', projectId } }),

  updateProject: (project) => {
    const { projects } = get();
    set({ projects: projects.map(p => p.id === project.id ? project : p) });
  },
  removeProject: (projectId) => {
    const { projects } = get();
    set({ projects: projects.filter(p => p.id !== projectId) });
  },
}));