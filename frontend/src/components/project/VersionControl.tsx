'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  GitBranch, 
  Clock, 
  User, 
  Star, 
  Eye, 
  Copy, 
  Plus,
  ArrowRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { promptsApi } from '@/lib/api';

interface VersionControlProps {
  projectId: string;
  promptId?: string | null;
}

interface PromptVersion {
  id: string;
  version: string;
  name: string;
  content: string;
  author: string;
  createdAt: Date;
  parentVersion?: string;
  metrics: {
    testCount: number;
    successRate: number;
    avgLatency: number;
    avgCost: number;
  };
  tags: string[];
  notes: string;
  isActive: boolean;
}

export function VersionControl({ projectId, promptId }: VersionControlProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<string>('prompt-1');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPromptVersions() {
      setLoading(true);
      setError(null);
      try {
        if (promptId) {
          const res = await promptsApi.get(projectId, promptId);
          setPromptVersions(res.data.versions || []);
        }
      } catch (e) {
        setError('Failed to load prompt versions.');
      } finally {
        setLoading(false);
      }
    }
    fetchPromptVersions();
  }, [projectId, promptId]);

  const prompts = [
    { id: 'prompt-1', name: 'Customer Support Agent' },
    { id: 'prompt-2', name: 'Product Description Generator' },
    { id: 'prompt-3', name: 'Email Response Template' }
  ];

  const createNewVersion = () => {
    // TODO: Implement new version creation
    console.log('Creating new version...');
  };

  const revertToVersion = (versionId: string) => {
    // TODO: Implement version revert
    console.log('Reverting to version:', versionId);
  };

  const toggleVersionSelection = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(prev => prev.filter(id => id !== versionId));
    } else {
      setSelectedVersions(prev => [...prev, versionId].slice(-2)); // Max 2 for comparison
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Version Control</h1>
          <p className="text-muted-foreground">
            Track and manage different versions of your prompts
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setCompareMode(!compareMode)}>
            <Eye className="w-4 h-4 mr-2" />
            {compareMode ? 'Exit Compare' : 'Compare Versions'}
          </Button>
          <Button onClick={createNewVersion}>
            <Plus className="w-4 h-4 mr-2" />
            New Version
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <Button
                  key={prompt.id}
                  variant={selectedPrompt === prompt.id ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedPrompt(prompt.id)}
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  {prompt.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="metrics">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-4">
              <div className="space-y-4">
                {promptVersions.map((version, index) => (
                  <Card key={version.id} className={version.isActive ? 'ring-2 ring-primary' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Badge variant={version.isActive ? 'default' : 'secondary'}>
                              v{version.version}
                            </Badge>
                            {version.isActive && <Badge variant="outline">Active</Badge>}
                          </div>
                          <h3 className="font-semibold">{version.name}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          {compareMode && (
                            <input
                              type="checkbox"
                              checked={selectedVersions.includes(version.id)}
                              onChange={() => toggleVersionSelection(version.id)}
                              className="rounded"
                            />
                          )}
                          <Button variant="ghost" size="sm">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => revertToVersion(version.id)}>
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {version.author}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {version.createdAt.toLocaleDateString()}
                        </div>
                        <div className="flex space-x-1">
                          {version.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-muted p-3 rounded text-sm">
                          {version.content}
                        </div>
                        
                        {version.notes && (
                          <div>
                            <p className="text-sm text-muted-foreground">{version.notes}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-medium">{version.metrics.testCount}</div>
                            <div className="text-muted-foreground">Tests</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{version.metrics.successRate}%</div>
                            <div className="text-muted-foreground">Success</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{version.metrics.avgLatency}ms</div>
                            <div className="text-muted-foreground">Latency</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">${version.metrics.avgCost}</div>
                            <div className="text-muted-foreground">Cost</div>
                          </div>
                        </div>

                        {version.parentVersion && index < promptVersions.length - 1 && (
                          <div className="flex items-center justify-center text-muted-foreground">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              {selectedVersions.length === 2 ? (
                <div className="grid grid-cols-2 gap-4">
                  {selectedVersions.map(versionId => {
                    const version = promptVersions.find(v => v.id === versionId);
                    if (!version) return null;
                    
                    return (
                      <Card key={versionId}>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Badge>v{version.version}</Badge>
                            <span>{version.name}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="bg-muted p-3 rounded text-sm">
                              {version.content}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>Success: {version.metrics.successRate}%</div>
                              <div>Latency: {version.metrics.avgLatency}ms</div>
                              <div>Tests: {version.metrics.testCount}</div>
                              <div>Cost: ${version.metrics.avgCost}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select exactly 2 versions from the timeline to compare them</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Success Rate Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">+13.6%</div>
                    <p className="text-sm text-muted-foreground">From v1.0 to v2.0</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Latency Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">-300ms</div>
                    <p className="text-sm text-muted-foreground">Average reduction</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Star className="w-5 h-5 mr-2" />
                      Best Version
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">v2.0</div>
                    <p className="text-sm text-muted-foreground">Current active version</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}