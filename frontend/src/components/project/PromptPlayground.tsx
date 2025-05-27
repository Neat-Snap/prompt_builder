import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Play, RefreshCw, Copy, Save } from 'lucide-react';
import { promptsApi } from '@/lib/api';

interface PromptPlaygroundProps {
  projectId: string;
  promptId?: string | null;
}

const availableModels = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', cost: '$0.03/1K tokens' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', cost: '$0.002/1K tokens' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', cost: '$0.015/1K tokens' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', cost: '$0.0025/1K tokens' },
];

export function PromptPlayground({ projectId, promptId }: PromptPlaygroundProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4');
  const [isRunning, setIsRunning] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            // Fetch latest version content
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

  const handleSelectPrompt = async (id: string) => {
    setSelectedPromptId(id);
    setPrompt('');
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

  const handleSave = async () => {
    if (!selectedPromptId) return;
    setSaving(true);
    setError(null);
    try {
      // Get current versions to determine next version number
      const promptRes = await promptsApi.get(projectId, selectedPromptId);
      const versions = promptRes.data.versions || [];
      const nextVersion = versions.length > 0 ? Math.max(...versions.map((v: any) => v.version_number)) + 1 : 1;
      await promptsApi.update(projectId, selectedPromptId, {
        version_number: nextVersion,
        prompt_text: prompt
      });
    } catch (e) {
      setError('Failed to save prompt.');
    } finally {
      setSaving(false);
    }
  };

  const runPlayground = async () => {
    if (!prompt || !selectedModel) return;
    setIsRunning(true);
    setResponse('');
    // Simulate API call
    setTimeout(() => {
      setResponse(`This is a mock response from ${selectedModel}.`);
      setIsRunning(false);
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Prompt Playground</h1>
        <p className="text-muted-foreground">Quickly test your prompt with different models and settings.</p>
      </div>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prompt Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Prompt</span>
              <div className="flex space-x-2">
                <Select value={selectedPromptId ?? ''} onValueChange={handleSelectPrompt}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Load saved prompt" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedPrompts.map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id}>
                        {prompt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleSave} disabled={!selectedPromptId || saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
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
              disabled={loading || !selectedPromptId}
            />
            <div className="mt-2 text-sm text-muted-foreground">
              Characters: {prompt?.length || 0} • Est. tokens: ~{Math.ceil((prompt?.length || 0) / 4)}
            </div>
          </CardContent>
        </Card>
        {/* Playground Controls */}
        <div className="space-y-4">
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
                onClick={runPlayground} 
                disabled={!prompt || isRunning}
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
                    Run
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          {/* Response Block */}
          <Card>
            <CardHeader>
              <CardTitle>Response</CardTitle>
            </CardHeader>
            <CardContent>
              {response ? (
                <div className="flex flex-col space-y-2">
                  <div className="bg-muted p-3 rounded text-sm">{response}</div>
                  <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(response)}>
                    <Copy className="w-4 h-4" /> Copy
                  </Button>
                </div>
              ) : (
                <div className="text-muted-foreground">Run the playground to see the response here.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 