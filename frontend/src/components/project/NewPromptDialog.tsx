'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { promptsApi } from '@/lib/api';

interface NewPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onPromptCreated: () => void;
}

export function NewPromptDialog({ open, onOpenChange, projectId, onPromptCreated }: NewPromptDialogProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await promptsApi.create(projectId, {
        name,
        prompt_textS: '', // Empty content initially
        version: 1
      });

      // Reset form and close dialog
      setName('');
      onOpenChange(false);
      onPromptCreated();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create prompt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Prompt</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Prompt Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter prompt name"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Prompt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 