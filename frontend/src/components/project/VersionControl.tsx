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
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { promptsApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Prompt, PromptVersion } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VersionControlProps {
  projectId: string;
  promptId?: string | null;
}

type VersionFilter = 'all' | 'autosaved' | 'custom';

export function VersionControl({ projectId, promptId }: VersionControlProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(promptId ?? null);
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [manualVersionName, setManualVersionName] = useState('');
  const [manualVersionComment, setManualVersionComment] = useState('');
  const [versionFilter, setVersionFilter] = useState<VersionFilter>('all');
  const [openRuns, setOpenRuns] = useState<{ [versionId: string]: boolean }>({});

  useEffect(() => {
    async function fetchPrompts() {
      setLoading(true);
      setError(null);
      try {
        const res = await promptsApi.list(projectId);
        setPrompts(res.data);
        if (!selectedPromptId && res.data.length > 0) {
          setSelectedPromptId(res.data[0].id);
        }
      } catch (e) {
        setError('Failed to load prompts.');
      } finally {
        setLoading(false);
      }
    }
    fetchPrompts();
  }, [projectId]);

  useEffect(() => {
    async function fetchPromptVersions() {
      if (!selectedPromptId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await promptsApi.get(projectId, selectedPromptId);
        const versions = (res.data.versions || []).map((v: any) => {
          let comments: { name?: string; comment?: string } = {};
          if (v.comments && typeof v.comments === 'object') {
            comments = v.comments;
          } else if (typeof v.comments === 'string') {
            try { comments = JSON.parse(v.comments); } catch {}
          }
          const runs = v.runs || [];
          return {
            id: v.id,
            version: v.version_number,
            content: v.prompt_text,
            createdAt: v.created_at,
            isActive: v.isActive || false,
            comments,
            runs,
          };
        });
        setPromptVersions(versions);
      } catch (e) {
        setError('Failed to load prompt versions.');
      } finally {
        setLoading(false);
      }
    }
    fetchPromptVersions();
  }, [projectId, selectedPromptId]);

  const handleSaveManualVersion = async () => {
    setSaveDialogOpen(false);
    setManualVersionName('');
    setManualVersionComment('');
    if (selectedPromptId) {
      const res = await promptsApi.get(projectId, selectedPromptId);
      const versions = (res.data.versions || []).map((v: any) => ({
        id: v.id,
        version: v.version_number,
        content: v.prompt_text,
        createdAt: v.created_at,
        isActive: v.isActive || false,
        name: v.name || '',
        comment: v.comment || '',
      }));
      setPromptVersions(versions);
    }
  };

  const handlePromptSelect = (id: string) => {
    setSelectedPromptId(id);
    setSelectedVersions([]);
  };

  const toggleVersionSelection = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(prev => prev.filter(id => id !== versionId));
    } else {
      setSelectedVersions(prev => [...prev, versionId].slice(-2));
    }
  };

  const handleMakeLatest = async (version: PromptVersion) => {
    if (!selectedPromptId) return;
    setLoading(true);
    setError(null);
    try {
      await promptsApi.update(projectId, selectedPromptId, {
        prompt_text: version.content,
      });
      const res = await promptsApi.get(projectId, selectedPromptId);
      const versions = (res.data.versions || []).map((v: any) => ({
        id: v.id,
        version: v.version_number,
        content: v.prompt_text,
        createdAt: v.created_at,
        isActive: v.isActive || false,
        name: v.name || '',
        comment: v.comment || '',
      }));
      setPromptVersions(versions);
    } catch (e) {
      setError('Failed to make this version the latest.');
    } finally {
      setLoading(false);
    }
  };

  const filteredVersions = promptVersions.filter((version) => {
    if (versionFilter === 'all') return true;
    const name = version.comments?.name;
    if (versionFilter === 'custom') return !!name;
    if (versionFilter === 'autosaved') return !name;
    return true;
  });

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
          <Button onClick={() => setSaveDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Save as Version
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center space-x-4">
        <span className="font-medium">Show:</span>
        <Select value={versionFilter} onValueChange={val => setVersionFilter(val as VersionFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Versions</SelectItem>
            <SelectItem value="autosaved">Autosaved Only</SelectItem>
            <SelectItem value="custom">Custom Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <Button
                  key={prompt.id}
                  variant={selectedPromptId === prompt.id ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handlePromptSelect(prompt.id)}
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  {prompt.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-4">
              <div className="space-y-4">
                {[...filteredVersions].reverse().map((version, index) => (
                  <Card key={version.id} className={version.isActive ? 'ring-2 ring-primary' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Badge variant={version.isActive ? 'default' : 'secondary'}>
                              v{version.version}
                            </Badge>
                            {version.isActive && <Badge variant="outline">Active</Badge>}
                            {version.comments?.name && (
                              <Badge variant="outline" className="ml-2"><User className="w-3 h-3 mr-1 inline" />{version.comments.name}</Badge>
                            )}
                          </div>
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
                          <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(version.content)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleMakeLatest(version)}>
                            Make the latest
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {version.createdAt ? (typeof version.createdAt === 'string' ? new Date(version.createdAt).toLocaleString() : version.createdAt.toLocaleString()) : ''}
                        </div>
                        {version.isActive && <Star className="w-4 h-4 text-yellow-500 ml-2" />}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-muted p-3 rounded text-sm">
                          {version.content}
                        </div>
                        {version.comments?.comment && (
                          <div className="text-xs text-muted-foreground mt-2">Comment: {version.comments.comment}</div>
                        )}
                        {version.runs && version.runs.length > 0 && (
                          <div className="mt-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center"
                              onClick={() => setOpenRuns(prev => ({ ...prev, [version.id]: !prev[version.id] }))}
                            >
                              {openRuns[version.id] ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                              {openRuns[version.id] ? 'Hide Runs' : `Show Runs (${version.runs.length})`}
                            </Button>
                            {openRuns[version.id] && (
                              <div className="mt-2 border rounded bg-background p-2 space-y-2">
                                {version.runs.map(run => (
                                  <div key={run.id} className="border-b last:border-b-0 pb-2 mb-2 last:pb-0 last:mb-0">
                                    <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
                                      <span><b>ID:</b> {run.id}</span>
                                      <span><b>Model:</b> {run.model}</span>
                                      {typeof run.cost === 'number' && run.cost !== null && <span><b>Cost:</b> {run.cost}</span>}
                                      <span><b>Started:</b> {run.started_at ? (typeof run.started_at === 'string' ? new Date(run.started_at).toLocaleString() : run.started_at.toLocaleString()) : ''}</span>
                                      {run.finish_time && run.started_at && (
                                        <span><b>Duration:</b> {(() => {
                                          const start = new Date(run.started_at).getTime();
                                          const end = new Date(run.finish_time).getTime();
                                          const ms = end - start;
                                          if (ms > 0) {
                                            const sec = Math.floor(ms / 1000);
                                            const min = Math.floor(sec / 60);
                                            const s = sec % 60;
                                            return min > 0 ? `${min}m ${s}s` : `${s}s`;
                                          }
                                          return '-';
                                        })()}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
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
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="bg-muted p-3 rounded text-sm">
                              {version.content}
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
          </Tabs>
        </div>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as New Version</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Version name (optional)"
              value={manualVersionName}
              onChange={e => setManualVersionName(e.target.value)}
            />
            <Textarea
              placeholder="Comment (optional)"
              value={manualVersionComment}
              onChange={e => setManualVersionComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSaveManualVersion}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
