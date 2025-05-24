'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Copy, 
  Eye, 
  Plus, 
  Settings,
  FileText,
  Wand2
} from 'lucide-react';

interface PromptsConstructorProps {
  projectId: string;
}

interface PromptBuilder {
  name: string;
  role: string;
  setting: string;
  context: string;
  task: string;
  constraints: string;
  outputFormat: string;
  examples: string;
  customFields: { key: string; value: string }[];
}

export function PromptsConstructor({ projectId }: PromptsConstructorProps) {
  const [promptBuilder, setPromptBuilder] = useState<PromptBuilder>({
    name: '',
    role: '',
    setting: '',
    context: '',
    task: '',
    constraints: '',
    outputFormat: '',
    examples: '',
    customFields: []
  });

  const [generatedPrompt, setGeneratedPrompt] = useState('');

  const rolePresets = [
    'Professional Assistant',
    'Creative Writer',
    'Technical Expert',
    'Customer Support Agent',
    'Data Analyst',
    'Content Moderator',
    'Educational Tutor',
    'Custom Role'
  ];

  const outputFormatPresets = [
    'Plain Text',
    'JSON',
    'Markdown',
    'HTML',
    'CSV',
    'Bullet Points',
    'Numbered List',
    'Custom Format'
  ];

  const updateField = (field: keyof PromptBuilder, value: string) => {
    setPromptBuilder(prev => ({ ...prev, [field]: value }));
  };

  const addCustomField = () => {
    setPromptBuilder(prev => ({
      ...prev,
      customFields: [...prev.customFields, { key: '', value: '' }]
    }));
  };

  const updateCustomField = (index: number, field: 'key' | 'value', value: string) => {
    setPromptBuilder(prev => ({
      ...prev,
      customFields: prev.customFields.map((cf, i) => 
        i === index ? { ...cf, [field]: value } : cf
      )
    }));
  };

  const removeCustomField = (index: number) => {
    setPromptBuilder(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index)
    }));
  };

  const generatePrompt = () => {
    let prompt = '';
    
    if (promptBuilder.role) {
      prompt += `You are ${promptBuilder.role}.\n\n`;
    }
    
    if (promptBuilder.setting) {
      prompt += `Context: ${promptBuilder.setting}\n\n`;
    }
    
    if (promptBuilder.context) {
      prompt += `Background Information:\n${promptBuilder.context}\n\n`;
    }
    
    if (promptBuilder.task) {
      prompt += `Task: ${promptBuilder.task}\n\n`;
    }
    
    if (promptBuilder.constraints) {
      prompt += `Constraints:\n${promptBuilder.constraints}\n\n`;
    }
    
    if (promptBuilder.outputFormat) {
      prompt += `Output Format: ${promptBuilder.outputFormat}\n\n`;
    }
    
    if (promptBuilder.examples) {
      prompt += `Examples:\n${promptBuilder.examples}\n\n`;
    }
    
    // Add custom fields
    promptBuilder.customFields.forEach(field => {
      if (field.key && field.value) {
        prompt += `${field.key}: ${field.value}\n\n`;
      }
    });
    
    setGeneratedPrompt(prompt.trim());
  };

  const savePrompt = () => {
    // TODO: Implement save to backend
    console.log('Saving prompt:', { name: promptBuilder.name, content: generatedPrompt });
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
            <CardTitle className="flex items-center">
              <Wand2 className="w-5 h-5 mr-2" />
              Prompt Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div>
              <Label htmlFor="prompt-name">Prompt Name</Label>
              <Input
                id="prompt-name"
                placeholder="e.g., Customer Support Response Generator"
                value={promptBuilder.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={promptBuilder.role} onValueChange={(value) => updateField('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {rolePresets.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="setting">Setting/Context</Label>
                  <Textarea
                    id="setting"
                    placeholder="Describe the environment or situation..."
                    value={promptBuilder.setting}
                    onChange={(e) => updateField('setting', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="task">Main Task</Label>
                  <Textarea
                    id="task"
                    placeholder="What should the AI accomplish?"
                    value={promptBuilder.task}
                    onChange={(e) => updateField('task', e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div>
                  <Label htmlFor="context">Background Information</Label>
                  <Textarea
                    id="context"
                    placeholder="Additional context that helps the AI understand the task better..."
                    value={promptBuilder.context}
                    onChange={(e) => updateField('context', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="constraints">Constraints & Guidelines</Label>
                  <Textarea
                    id="constraints"
                    placeholder="Rules, limitations, or specific requirements..."
                    value={promptBuilder.constraints}
                    onChange={(e) => updateField('constraints', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="output-format">Output Format</Label>
                  <Select value={promptBuilder.outputFormat} onValueChange={(value) => updateField('outputFormat', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select output format" />
                    </SelectTrigger>
                    <SelectContent>
                      {outputFormatPresets.map((format) => (
                        <SelectItem key={format} value={format}>{format}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="examples">Examples</Label>
                  <Textarea
                    id="examples"
                    placeholder="Provide examples of desired input/output..."
                    value={promptBuilder.examples}
                    onChange={(e) => updateField('examples', e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Custom Fields</Label>
                  <Button variant="outline" size="sm" onClick={addCustomField}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                {promptBuilder.customFields.map((field, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      placeholder="Field name"
                      value={field.key}
                      onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                    />
                    <Input
                      placeholder="Field value"
                      value={field.value}
                      onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCustomField(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex space-x-2">
              <Button onClick={generatePrompt} className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                Generate Preview
              </Button>
              <Button variant="outline" onClick={savePrompt} disabled={!promptBuilder.name || !generatedPrompt}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
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
            {generatedPrompt ? (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{generatedPrompt}</pre>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Characters: {generatedPrompt.length}</span>
                  <span>Words: {generatedPrompt.split(' ').length}</span>
                  <Badge variant="outline">
                    Est. tokens: ~{Math.ceil(generatedPrompt.length / 4)}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Fill out the form and click "Generate Preview" to see your prompt</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}