import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Play, RefreshCw, Copy, Save, Check, X as XIcon } from 'lucide-react';
import { promptsApi, llmApi } from '@/lib/api';

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
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState('');
  const [modelResults, setModelResults] = useState<any[]>([]);
  const [modelSearchLoading, setModelSearchLoading] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const modelSearchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [selectedModelObj, setSelectedModelObj] = useState<any>(null);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPrompt = useRef<string>('');
  const [promptLoaded, setPromptLoaded] = useState(false);
  const didUnmount = useRef(false);

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
            setPromptLoaded(false);
            const promptRes = await promptsApi.get(projectId, found.id);
            const versions = promptRes.data.versions || [];
            const latest = versions[versions.length - 1];
            setPrompt(latest?.prompt_text || '');
            setPromptLoaded(true);
          }
        }
      } catch (e) {
        setError('Failed to load prompts.');
        setPromptLoaded(false);
      } finally {
        setLoading(false);
      }
    }
    fetchPrompts();
  }, [projectId, promptId]);

  const handleSelectPrompt = async (id: string) => {
    setSelectedPromptId(id);
    setPrompt('');
    setPromptLoaded(false);
    setLoading(true);
    setError(null);
    try {
      const promptRes = await promptsApi.get(projectId, id);
      const versions = promptRes.data.versions || [];
      const latest = versions[versions.length - 1];
      setPrompt(latest?.prompt_text || '');
      setPromptLoaded(true);
    } catch (e) {
      setError('Failed to load prompt content.');
      setPromptLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedPromptId) return;
    if (!promptLoaded) return;
    if (prompt === lastSavedPrompt.current) return;
    if (!prompt && lastSavedPrompt.current) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setSaving(true);
    saveTimeout.current = setTimeout(async () => {
      try {
        const promptRes = await promptsApi.get(projectId, selectedPromptId);
        const versions = promptRes.data.versions || [];
        const latest = versions[versions.length - 1];
        const nextVersion = versions.length > 0 ? Math.max(...versions.map((v: any) => v.version_number)) + 1 : 1;
        await promptsApi.update(projectId, selectedPromptId, {
          prompt_text: prompt
        });
        lastSavedPrompt.current = prompt;
      } catch (e) {
      } finally {
        setSaving(false);
      }
    }, 800);
  }, [prompt, selectedPromptId, promptLoaded]);

  useEffect(() => {
    didUnmount.current = false;
    return () => {
      didUnmount.current = true;
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      if (!promptLoaded) return;
      if (selectedPromptId && prompt !== lastSavedPrompt.current) {
        if (!prompt && lastSavedPrompt.current) return;
        if (didUnmount.current) return;
        setSaving(true);
        promptsApi.get(projectId, selectedPromptId).then(promptRes => {
          const versions = promptRes.data.versions || [];
          const latest = versions[versions.length - 1];
          const nextVersion = versions.length > 0 ? Math.max(...versions.map((v: any) => v.version_number)) + 1 : 1;
          return promptsApi.update(projectId, selectedPromptId, {
            prompt_text: prompt
          });
        }).finally(() => setSaving(false));
        lastSavedPrompt.current = prompt;
      }
    };
  }, [selectedPromptId, promptLoaded]);

  useEffect(() => {
    if (!modelSearch) {
      setModelResults([]);
      return;
    }
    setModelSearchLoading(true);
    if (modelSearchTimeout.current) clearTimeout(modelSearchTimeout.current);
    modelSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await llmApi.searchModels(modelSearch);
        setModelResults(res.data.models);
      } catch {
        setModelResults([]);
      } finally {
        setModelSearchLoading(false);
      }
    }, 400);
  }, [modelSearch]);

  const runPlayground = async () => {
    if (!prompt || !selectedModel || !userPrompt) return;
    setIsRunning(true);
    setResponse('');
    setError(null);
    try {
      const systemPrompt = prompt;
      const res = await llmApi.request(systemPrompt, userPrompt, selectedModel);
      setResponse(res.data.result);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to get response from LLM.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Prompt Playground</h1>
        <p className="text-muted-foreground">Quickly test your prompt with different models and settings.</p>
      </div>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>System Prompt</span>
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
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter your prompt here... (system prompt)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={loading || !selectedPromptId}
            />
            <div className="mt-2 text-sm text-muted-foreground">
              Characters: {prompt?.length || 0} • Est. tokens: ~{Math.ceil((prompt?.length || 0) / 4)}
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium mb-1">Example User Prompt</label>
              <Textarea
                placeholder="Enter an example user prompt..."
                value={userPrompt}
                onChange={e => setUserPrompt(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  className={`w-full border rounded px-3 py-2 text-sm pr-10 ${selectedModelObj ? 'bg-green-50 cursor-pointer' : ''}`}
                  placeholder="Search models..."
                  value={selectedModelObj ? selectedModelObj.name : modelSearch}
                  onChange={e => {
                    if (!selectedModelObj) {
                      setModelSearch(e.target.value);
                      setModelDropdownOpen(true);
                    }
                  }}
                  onFocus={e => {
                    if (selectedModelObj) {
                      setSelectedModel('');
                      setSelectedModelObj(null);
                      setModelSearch('');
                      setModelDropdownOpen(true);
                      setTimeout(() => e.target.select(), 0);
                    } else {
                      setModelDropdownOpen(true);
                    }
                  }}
                  readOnly={!!selectedModelObj}
                />
                {selectedModelObj ? (
                  <>
                    <Check className="absolute right-8 top-1/2 -translate-y-1/2 text-green-600 w-5 h-5" />
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => {
                        setSelectedModel('');
                        setSelectedModelObj(null);
                        setModelSearch('');
                        setModelDropdownOpen(true);
                      }}
                      tabIndex={-1}
                      type="button"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </>
                ) : null}
                {modelDropdownOpen && modelSearch && !selectedModelObj && (
                  <div className="absolute z-10 bg-white border rounded shadow w-full mt-1 max-h-60 overflow-auto">
                    {modelSearchLoading ? (
                      <div className="p-2 text-sm text-muted-foreground">Searching...</div>
                    ) : modelResults.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No models found.</div>
                    ) : (
                      modelResults.map((model) => (
                        <div
                          key={model.slug}
                          className={`px-3 py-2 cursor-pointer hover:bg-accent flex items-center justify-between ${selectedModel === model.slug ? 'bg-accent' : ''}`}
                          onClick={() => {
                            setSelectedModel(model.slug);
                            setSelectedModelObj(model);
                            setModelDropdownOpen(false);
                          }}
                        >
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-xs text-muted-foreground">{model.author}</div>
                          </div>
                          {model.is_free && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Free</span>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <Button 
                onClick={runPlayground} 
                disabled={!prompt || !userPrompt || isRunning || !selectedModel}
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