export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  promptCount: number;
  testCount: number;
  lastActivity: Date;
}

export interface ApiKey {
  id: string;
  provider: 'openai' | 'anthropic' | 'openrouter' | 'other';
  name: string;
  key: string; // encrypted
  isDefault: boolean;
  projectId?: string; // null for account-level keys
}

export interface Prompt {
  id: string;
  name: string;
  version: number;
  content: string;
  role?: string;
  setting?: string;
  context?: string;
  outputFormat?: string;
  createdAt: Date;
  projectId: string;
}

export interface TestResult {
  id: string;
  promptId: string;
  model: string;
  response: string;
  latency: number;
  tokenCount: number;
  cost: number;
  createdAt: Date;
}

export interface Tab {
  id: string;
  type: 'home' | 'project';
  title: string;
  projectId?: string;
  isClosable: boolean;
}