import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Play, RefreshCw, Copy, Upload, Trash } from 'lucide-react';
import { promptsApi, testsetsApi } from '@/lib/api';
import type { TestSet, TestSetTest } from '@/types';

interface PromptTestSuiteProps {
  projectId: string;
  promptId?: string | null;
}

const availableModels = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', cost: '$0.03/1K tokens' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', cost: '$0.002/1K tokens' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', cost: '$0.015/1K tokens' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', cost: '$0.0025/1K tokens' },
];

interface TestCase {
  id: string;
  input: string;
}

interface TestResult {
  id: string;
  input: string;
  model: string;
  response: string;
  status: 'success' | 'error';
}

export function PromptTestSuite({ projectId, promptId }: PromptTestSuiteProps) {
  const [newInput, setNewInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('custom');
  const [customPrompt, setCustomPrompt] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [selectedTestSetId, setSelectedTestSetId] = useState<number | null>(null);
  const [testSetName, setTestSetName] = useState('');

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
            setSelectedPromptId(found.id);
            const promptRes = await promptsApi.get(projectId, found.id);
            const versions = promptRes.data.versions || [];
            const latest = versions[versions.length - 1];
            setPrompt(latest?.prompt_text || '');
          }
        } else {
          setSelectedPromptId('custom');
        }
      } catch (e) {
        setError('Failed to load prompts.');
      } finally {
        setLoading(false);
      }
    }
    fetchPrompts();
  }, [projectId, promptId]);

  useEffect(() => {
    async function fetchTestSets() {
      try {
        const res = await testsetsApi.list(projectId);
        setTestSets(res.data || []);
        if (res.data && res.data.length > 0 && selectedTestSetId === null) {
          setSelectedTestSetId(res.data[0].id);
        }
      } catch (e) {
        setError('Failed to load test sets.');
      }
    }
    fetchTestSets();
  }, [projectId]);

  const selectedTestSet = testSets.find(ts => ts.id === selectedTestSetId) || null;
  const testCases = selectedTestSet?.tests || [];

  const handleSelectPrompt = async (id: string) => {
    setSelectedPromptId(id);
    setPrompt('');
    setCustomPrompt('');
    if (id === 'custom') return;
    setLoading(true);
    setError(null);
    try {
      const promptRes = await promptsApi.get(projectId, id);
      const versions = promptRes.data.versions || [];
      const latest = versions[versions.length - 1];
      setPrompt(latest?.prompt_text || '');
    } catch (e) {
      setError('Failed to load prompt content.');
    } finally {
      setLoading(false);
    }
  };

  const addTestCase = async () => {
    if (!newInput.trim() || !selectedTestSetId) return;
    try {
      await testsetsApi.addTest(selectedTestSetId, newInput);
      setNewInput('');
      const res = await testsetsApi.list(projectId);
      setTestSets(res.data || []);
    } catch (e) {
      setError('Failed to add test.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTestSetId) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      for (const input of lines) {
        await testsetsApi.addTest(selectedTestSetId, input);
      }
      const res = await testsetsApi.list(projectId);
      setTestSets(res.data || []);
    };
    reader.readAsText(file);
  };

  const runSuite = async () => {
    setIsRunning(true);
    setResults([]);
    const usedPrompt = selectedPromptId === 'custom' ? customPrompt : prompt;
    // Simulate running tests
    for (const testCase of testCases) {
      setTimeout(() => {
        setResults(prev => [
          ...prev,
          {
            id: testCase.id,
            input: testCase.input,
            model: selectedModel,
            response: `Mock response for: ${testCase.input} (Prompt: ${usedPrompt.slice(0, 30)}...)`,
            status: 'success',
          },
        ]);
      }, Math.random() * 1000 + 500);
    }
    setTimeout(() => setIsRunning(false), 2000);
  };

  const handleCreateTestSet = async () => {
    if (!testSetName.trim()) return;
    try {
      await testsetsApi.create(projectId, { name: testSetName });
      setTestSetName('');
      const res = await testsetsApi.list(projectId);
      setTestSets(res.data || []);
    } catch (e) {
      setError('Failed to create test set.');
    }
  };

  const handleDeleteTestSet = async (testSetId: number) => {
    try {
      await testsetsApi.deleteTestset(testSetId);
      const res = await testsetsApi.list(projectId);
      setTestSets(res.data || []);
      if (selectedTestSetId === testSetId) {
        setSelectedTestSetId(res.data?.[0]?.id || null);
      }
    } catch (e) {
      setError('Failed to delete test set.');
    }
  };

  const handleDeleteTest = async (testId: number) => {
    if (!selectedTestSetId) return;
    try {
      await testsetsApi.deleteTest(selectedTestSetId, testId);
      const res = await testsetsApi.list(projectId);
      setTestSets(res.data || []);
    } catch (e) {
      setError('Failed to delete test.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Prompt Test Suite</h1>
        <p className="text-muted-foreground">Run your prompt against a suite of test cases and review results.</p>
      </div>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <div className="mb-4 w-full max-w-xs">
        <Select value={selectedTestSetId ? String(selectedTestSetId) : ''} onValueChange={val => setSelectedTestSetId(Number(val))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select test set" />
          </SelectTrigger>
          <SelectContent>
            <div className="px-2 py-2 border-b border-muted mb-2">
              <form className="flex space-x-2" onSubmit={e => { e.preventDefault(); handleCreateTestSet(); }}>
                <Input
                  placeholder="New test set name"
                  value={testSetName}
                  onChange={e => setTestSetName(e.target.value)}
                  className="h-8"
                />
                <Button type="submit" size="sm" disabled={!testSetName.trim()}>Add</Button>
              </form>
            </div>
            {testSets.map(ts => (
              <div key={ts.id} className="flex items-center justify-between px-2 py-1 group hover:bg-accent rounded cursor-pointer">
                <SelectItem value={String(ts.id)} className="flex-1 cursor-pointer">
                  {ts.name}
                </SelectItem>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-60 group-hover:opacity-100 ml-2"
                  onClick={e => { e.stopPropagation(); handleDeleteTestSet(ts.id); }}
                  tabIndex={-1}
                >
                  <Trash className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Data Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Test Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-2">
              <Input
                placeholder="Add test input..."
                value={newInput}
                onChange={e => setNewInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTestCase(); }}
                disabled={!selectedTestSetId}
              />
              <Button onClick={addTestCase} disabled={!selectedTestSetId}>Add</Button>
              <label className="inline-flex items-center cursor-pointer">
                <Upload className="w-4 h-4 mr-1" />
                <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} disabled={!selectedTestSetId} />
                <span className="text-xs">Upload</span>
              </label>
            </div>
            <div className="overflow-auto max-h-48 border rounded">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 text-left">Input</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testCases.map(tc => (
                    <tr key={tc.id}>
                      <td className="p-2 border-b">{tc.prompt ?? tc.input}</td>
                      <td className="p-2 border-b">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTest(Number(tc.id))}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                  {testCases.length === 0 && (
                    <tr><td className="p-2 text-muted-foreground" colSpan={2}>No test cases yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {/* Right Column: Prompt Selector, Model/Settings, Results */}
        <div className="space-y-4">
          {/* Prompt Selector & Custom Prompt */}
          <Card>
            <CardHeader>
              <CardTitle>Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-2">
                <Select value={selectedPromptId} onValueChange={handleSelectPrompt}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select prompt or custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Prompt</SelectItem>
                    {savedPrompts.map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id}>
                        {prompt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPromptId === 'custom' && (
                  <Textarea
                    placeholder="Enter your custom prompt here..."
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    className="min-h-[40px] w-96"
                    disabled={loading}
                  />
                )}
                {selectedPromptId !== 'custom' && (
                  <Textarea
                    value={prompt}
                    className="min-h-[40px] w-96"
                    disabled
                  />
                )}
              </div>
            </CardContent>
          </Card>
          {/* Model & Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Model & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} <span className="text-xs text-muted-foreground ml-2">({model.provider})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={runSuite} 
                disabled={testCases.length === 0 || isRunning || (selectedPromptId === 'custom' && !customPrompt) || (selectedPromptId !== 'custom' && !prompt)}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Suite
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          {/* Results Block */}
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-muted-foreground">Run the test suite to see results here.</div>
              ) : (
                <div className="space-y-2">
                  {results.map(result => (
                    <div key={result.id} className="border rounded p-2 flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{result.input}</span>
                        <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>{result.status}</Badge>
                      </div>
                      <div className="bg-muted p-2 rounded text-xs mb-1">{result.response}</div>
                      <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(result.response)}>
                        <Copy className="w-4 h-4" /> Copy
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 