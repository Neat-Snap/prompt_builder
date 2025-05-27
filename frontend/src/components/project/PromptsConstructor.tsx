'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Copy, 
  Plus,
  Settings,
  FileText,
  Wand2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
  PlusCircle
} from 'lucide-react';
import { promptsApi } from '@/lib/api';
import { DragDropContext, Droppable, Draggable, DroppableProvided } from '@hello-pangea/dnd';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PromptsConstructorProps {
  projectId: string;
  promptId?: string | null;
}

interface PromptBlock {
  id: string;
  type: string;
  content: string;
  isExpanded: boolean;
  isCustom?: boolean;
}

interface PromptBuilder {
  name: string;
  blocks: PromptBlock[];
}

const PREDEFINED_BLOCK_TYPES = {
  role: 'Role',
  context: 'Context',
  task: 'Task',
  constraints: 'Constraints & Guidelines',
  outputFormat: 'Output Format',
  examples: 'Examples',
} as const;

export function PromptsConstructor({ projectId, promptId }: PromptsConstructorProps) {
  const [promptBuilder, setPromptBuilder] = useState<PromptBuilder>({
    name: '',
    blocks: []
  });

  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newCustomBlockName, setNewCustomBlockName] = useState('');

  const resetForm = () => {
    setPromptBuilder({
      name: '',
      blocks: []
    });
    setGeneratedPrompt('');
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    if (promptId) {
      setLoading(true);
      promptsApi.get(projectId, promptId)
        .then(res => {
          const blocks: PromptBlock[] = [];
          
          // Get the latest version's prompt text
          const versions = res.data.versions || [];
          const latestVersion = versions[versions.length - 1];
          
          if (latestVersion?.prompt_text) {
            // Parse the prompt text to extract blocks
            const tagRegex = /<([^>]+)>\n([\s\S]*?)\n<\/\1>/g;
            let match;
            
            while ((match = tagRegex.exec(latestVersion.prompt_text)) !== null) {
              const [_, tagName, content] = match;
              const isCustom = !Object.keys(PREDEFINED_BLOCK_TYPES).includes(tagName.toLowerCase());
              
              blocks.push({
                id: `${tagName.toLowerCase()}-${Date.now()}-${blocks.length}`,
                type: isCustom ? tagName : tagName.toLowerCase(),
                content: content.trim(),
                isExpanded: true,
                isCustom
              });
            }
          }

          setPromptBuilder({
            name: res.data.name || '',
            blocks
          });
          setGeneratedPrompt(latestVersion?.prompt_text || '');
        })
        .catch(() => {
          setError('Failed to load prompt.');
          resetForm();
        })
        .finally(() => setLoading(false));
    } else {
      resetForm();
    }
  }, [promptId, projectId]);

  const updateGeneratedPrompt = (blocks: PromptBlock[]) => {
    let prompt = '';
    
    blocks.forEach(block => {
      if (block.content.trim()) {
        const tagName = block.isCustom ? block.type : block.type.charAt(0).toUpperCase() + block.type.slice(1);
        prompt += `<${tagName}>\n${block.content.trim()}\n</${tagName}>\n\n`;
      }
    });
    
    setGeneratedPrompt(prompt.trim());
  };

  const addBlock = (type: string, isCustom: boolean = false) => {
    const newBlock: PromptBlock = {
      id: `${type}-${Date.now()}`,
      type,
      content: '',
      isExpanded: true,
      isCustom
    };
    
    setPromptBuilder(prev => {
      const newBlocks = [...prev.blocks, newBlock];
      updateGeneratedPrompt(newBlocks);
      return { ...prev, blocks: newBlocks };
    });
  };

  const handleAddCustomBlock = () => {
    if (newCustomBlockName.trim()) {
      addBlock(newCustomBlockName.trim(), true);
      setNewCustomBlockName('');
    }
  };

  const updateBlock = (id: string, content: string) => {
    setPromptBuilder(prev => {
      const newBlocks = prev.blocks.map(block => 
        block.id === id ? { ...block, content } : block
      );
      updateGeneratedPrompt(newBlocks);
      return { ...prev, blocks: newBlocks };
    });
  };

  const removeBlock = (id: string) => {
    setPromptBuilder(prev => {
      const newBlocks = prev.blocks.filter(block => block.id !== id);
      updateGeneratedPrompt(newBlocks);
      return { ...prev, blocks: newBlocks };
    });
  };

  const toggleBlockExpansion = (id: string) => {
    setPromptBuilder(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => 
        block.id === id ? { ...block, isExpanded: !block.isExpanded } : block
      )
    }));
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const blocks = Array.from(promptBuilder.blocks);
    const [reorderedBlock] = blocks.splice(result.source.index, 1);
    blocks.splice(result.destination.index, 0, reorderedBlock);

    setPromptBuilder(prev => {
      updateGeneratedPrompt(blocks);
      return { ...prev, blocks };
    });
  };

  const savePrompt = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (promptId) {
        const promptRes = await promptsApi.get(projectId, promptId);
        const versions = (promptRes.data && promptRes.data.versions) ? promptRes.data.versions : [];
        const nextVersion = versions.length > 0 ? Math.max(...versions.map((v: any) => v.version_number)) + 1 : 1;
        
        await promptsApi.update(projectId, promptId, {
          version_number: nextVersion,
          prompt_text: generatedPrompt
        });
        setSuccess('Prompt version updated!');
      } else {
        await promptsApi.create(projectId, { name: promptBuilder.name });
        setSuccess('Prompt created!');
      }
    } catch (e) {
      setError('Failed to save prompt.');
    } finally {
      setLoading(false);
    }
  };

  const getBlockTitle = (block: PromptBlock) => {
    if (block.isCustom) {
      return block.type;
    }
    return PREDEFINED_BLOCK_TYPES[block.type as keyof typeof PREDEFINED_BLOCK_TYPES] || block.type;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Prompt Constructor</h1>
        <p className="text-muted-foreground">
          Build your prompts systematically using structured components
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Builder Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Wand2 className="w-5 h-5 mr-2" />
                Prompt Builder
              </div>
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Block
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {Object.entries(PREDEFINED_BLOCK_TYPES).map(([type, label]) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => addBlock(type)}
                      >
                        {label}
                      </DropdownMenuItem>
                    ))}
                    <Separator className="my-2" />
                    <div className="px-2 py-1.5">
                      <div className="text-sm font-medium mb-2">Custom Block</div>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Block name"
                          value={newCustomBlockName}
                          onChange={(e) => setNewCustomBlockName(e.target.value)}
                          className="h-8"
                        />
                        <Button
                          size="sm"
                          onClick={handleAddCustomBlock}
                          disabled={!newCustomBlockName.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="outline" 
                  onClick={savePrompt} 
                  disabled={!promptBuilder.name || !generatedPrompt || loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="prompt-name">Prompt Name</Label>
              <Input
                id="prompt-name"
                placeholder="e.g., Customer Support Response Generator"
                value={promptBuilder.name}
                onChange={(e) => setPromptBuilder(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="prompt-blocks">
                {(provided: DroppableProvided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {promptBuilder.blocks.map((block, index) => (
                      <Draggable key={block.id} draggableId={block.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="border rounded-lg overflow-hidden"
                          >
                            <div className="flex items-center justify-between p-3 bg-muted">
                              <div className="flex items-center space-x-2">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <span className="font-medium">{getBlockTitle(block)}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleBlockExpansion(block.id)}
                                >
                                  {block.isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeBlock(block.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {block.isExpanded && (
                              <div className="p-4">
                                <Textarea
                                  placeholder={`Enter ${getBlockTitle(block).toLowerCase()}...`}
                                  value={block.content}
                                  onChange={(e) => updateBlock(block.id, e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {error && (
              <div className="text-sm text-red-500">{error}</div>
            )}
            {success && (
              <div className="text-sm text-green-500">{success}</div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Generated Prompt
              </div>
              {generatedPrompt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
                {generatedPrompt || 'Add components to see the generated prompt here...'}
              </div>
              {generatedPrompt && (
                <div className="text-sm text-muted-foreground">
                  <div>Characters: {generatedPrompt.length}</div>
                  <div>Estimated tokens: ~{Math.ceil(generatedPrompt.length / 4)}</div>
                  <div>Estimated cost: ${(generatedPrompt.length / 4 * 0.0001).toFixed(4)}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}