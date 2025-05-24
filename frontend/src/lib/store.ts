import { create } from 'zustand';
import { Tab, User, Project } from '@/types';

interface AppState {
  user: User | null;
  projects: Project[];
  tabs: Tab[];
  activeTabId: string;
  
  // Actions
  setUser: (user: User | null) => void;
  setProjects: (projects: Project[]) => void;
  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  updateProject: (project: Project) => void;
  removeProject: (projectId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  projects: [],
  tabs: [
    {
      id: 'home',
      type: 'home',
      title: 'Home',
      isClosable: false,
    },
  ],
  activeTabId: 'home',

  setUser: (user) => set({ user }),
  setProjects: (projects) => set({ projects }),
  
  addTab: (tab) => {
    const { tabs } = get();
    const existingTab = tabs.find(t => t.id === tab.id);
    if (!existingTab) {
      set({ tabs: [...tabs, tab], activeTabId: tab.id });
    } else {
      set({ activeTabId: tab.id });
    }
  },
  
  removeTab: (tabId) => {
    const { tabs, activeTabId } = get();
    const newTabs = tabs.filter(t => t.id !== tabId);
    const newActiveTabId = activeTabId === tabId ? 'home' : activeTabId;
    set({ tabs: newTabs, activeTabId: newActiveTabId });
  },
  
  setActiveTab: (tabId) => set({ activeTabId: tabId }),
  
  updateTab: (tabId, updates) => {
    const { tabs } = get();
    const newTabs = tabs.map(tab =>
      tab.id === tabId ? { ...tab, ...updates } : tab
    );
    set({ tabs: newTabs });
  },

  updateProject: (project) => {
    const { projects } = get();
    set({ projects: projects.map(p => p.id === project.id ? project : p) });
  },
  removeProject: (projectId) => {
    const { projects } = get();
    set({ projects: projects.filter(p => p.id !== projectId) });
  },
}));