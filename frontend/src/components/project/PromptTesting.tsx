'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Save, 
  List,
  Clock,
  Zap,
  DollarSign,
  Copy,
  Download,
  Settings
} from 'lucide-react';
import { promptsApi } from '@/lib/api';
import { SaveCustomVersionDialog } from './SaveCustomVersionDialog';

interface PromptTestingProps {
  projectId: string;
  promptId?: string | null;
}

interface TestResult {
  id: string;
  model: string;
  response: string;
  latency: number;
  tokens: number;
  cost: number;
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
}

export function PromptTesting({ projectId, promptId }: PromptTestingProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customVersionDialogOpen, setCustomVersionDialogOpen] = useState(false);
  const [customVersionLoading, setCustomVersionLoading] = useState(false);

  const availableModels = [
    { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', cost: '$0.03/1K tokens' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', cost: '$0.002/1K tokens' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', cost: '$0.015/1K tokens' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', cost: '$0.0025/1K tokens' },
  ];

  useEffect(() => {
    async function fetchPrompts() {
      setLoading(true);
      setError(null);
      try {
        const res = await promptsApi.list(projectId);
        setSavedPrompts(res.data);
        if (promptId) {
          const found = res.data.find((p: any) => p.id === promptId);
          if (found) {
            const promptRes = await promptsApi.get(projectId, found.id);
            const versions = promptRes.data.versions || [];
            const latest = versions[versions.length - 1];
            setPrompt(latest?.prompt_text || '');
          }
        }
      } catch (e) {
        setError('Failed to load prompts.');
      } finally {
        setLoading(false);
      }
    }
    fetchPrompts();
  }, [projectId, promptId]);

  const runTests = async () => {
    if (!prompt || selectedModels.length === 0) return;

    setIsRunning(true);
    
    for (const modelId of selectedModels) {
      const model = availableModels.find(m => m.id === modelId);
      if (!model) continue;

      setTimeout(() => {
        const mockResult: TestResult = {
          id: Math.random().toString(36).substr(2, 9),
          model: model.name,
          response: `This is a mock response from ${model.name}. In a real implementation, this would be the actual AI response to your prompt. The response quality and style would vary based on the model's capabilities and training.`,
          latency: Math.random() * 3000 + 500,
          tokens: Math.floor(Math.random() * 500) + 100,
          cost: parseFloat((Math.random() * 0.1 + 0.01).toFixed(4)),
          timestamp: new Date(),
          status: 'success'
        };

        setTestResults(prev => [...prev, mockResult]);
      }, Math.random() * 2000 + 1000);
    }

    setTimeout(() => {
      setIsRunning(false);
    }, 3000);
  };

  const loadPrompt = (promptContent: string) => {
    setPrompt(promptContent);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const exportResults = () => {
    const data = JSON.stringify(testResults, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveCustomVersion = async (name: string, comment: string) => {
    setCustomVersionLoading(true);
    setError(null);
    try {
      if (promptId) {
        const promptRes = await promptsApi.get(projectId, promptId);
        const versions = promptRes.data.versions || [];
        const nextVersion = versions.length > 0 ? Math.max(...versions.map((v: any) => v.version_number)) + 1 : 1;
        await promptsApi.update(projectId, promptId, {
          version_number: nextVersion,
          prompt_text: prompt,
          comments: { name, comment },
        });
      }
    } catch (e) {
      setError('Failed to save custom version.');
    } finally {
      setCustomVersionLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Prompt Testing Panel</h1>
        <p className="text-muted-foreground">
          Test your prompts across multiple AI models and compare results
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Prompt Input</span>
                <div className="flex space-x-2">
                  <Select onValueChange={loadPrompt}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Load saved prompt" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedPrompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={prompt.content}>
                          {prompt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomVersionDialogOpen(true)}
                    disabled={!promptId || loading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Custom Version
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[200px] resize-none"
              />
              <div className="mt-2 text-sm text-muted-foreground">
                Characters: {prompt?.length || 0} • Est. tokens: ~{Math.ceil((prompt?.length || 0) / 4)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Test Results</span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={clearResults}>
                    Clear
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportResults} disabled={testResults.length === 0}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Run tests to see results here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {testResults.map((result) => (
                    <div key={result.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{result.model}</Badge>
                          <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                            {result.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {result.latency.toFixed(0)}ms
                          </div>
                          <div className="flex items-center">
                            <Zap className="w-4 h-4 mr-1" />
                            {result.tokens} tokens
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            ${result.cost.toFixed(4)}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(result.response)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="bg-muted p-3 rounded text-sm">
                        {result.response}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableModels.map((model) => (
                <div key={model.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={model.id}
                    checked={selectedModels.includes(model.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedModels(prev => [...prev, model.id]);
                      } else {
                        setSelectedModels(prev => prev.filter(id => id !== model.id));
                      }
                    }}
                  />
                  <label htmlFor={model.id} className="flex-1 cursor-pointer">
                    <div className="font-medium">{model.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {model.provider} • {model.cost}
                    </div>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={runTests} 
                disabled={!prompt || selectedModels.length === 0 || isRunning}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Tests
                  </>
                )}
              </Button>

              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{testResults.length}/{selectedModels.length}</span>
                  </div>
                  <Progress value={(testResults.length / selectedModels.length) * 100} />
                </div>
              )}

              <Button variant="outline" className="w-full">
                <List className="w-4 h-4 mr-2" />
                Compare Results
              </Button>

              <Button variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                API Settings
              </Button>
            </CardContent>
          </Card>

          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Tests:</span>
                  <span>{testResults.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Latency:</span>
                  <span>{(testResults.reduce((acc, r) => acc + r.latency, 0) / testResults.length).toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Cost:</span>
                  <span>${testResults.reduce((acc, r) => acc + r.cost, 0).toFixed(4)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <SaveCustomVersionDialog
        open={customVersionDialogOpen}
        onOpenChange={setCustomVersionDialogOpen}
        onSave={saveCustomVersion}
        loading={customVersionLoading}
      />
    </div>
  );
}