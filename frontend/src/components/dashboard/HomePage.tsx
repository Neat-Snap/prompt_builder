'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  FolderPlus, 
  Activity, 
  Zap, 
  TrendingUp, 
  Settings,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Project } from '@/types';
import { NewProjectDialog } from '@/components/project/NewProjectDialog';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import api, { authApi } from '@/lib/api';
import { Label } from '@/components/ui/label';

export function HomePage() {
  const { user, projects, openProject } = useAppStore();
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string|null>(null);
  const [changeEmailDialogOpen, setChangeEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailStep, setEmailStep] = useState<'input' | 'sending' | 'sent' | 'verifying' | 'success'>('input');
  const [emailCode, setEmailCode] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (settingsOpen) {
      api.get('/llm/keys').then(res => {
        setOpenrouterKey(res.data?.keys?.openrouter || '');
      });
    }
  }, [settingsOpen]);

  const handleSaveKey = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await api.post('/llm/openrouter_key', { openrouter_key: openrouterKey });
      setSaveMsg('Key saved!');
    } catch (e) {
      setSaveMsg('Failed to save key.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmailVerification = async () => {
    setEmailLoading(true);
    setEmailError(null);
    try {
      await authApi.sendVerificationEmail(newEmail);
      setEmailStep('sent');
    } catch (err: any) {
      setEmailError(err.response?.data?.detail || 'Failed to send verification email.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    setEmailLoading(true);
    setEmailError(null);
    try {
      await authApi.verifyEmailCode(emailCode, newEmail);
      const res = await authApi.changeEmail(newEmail);
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      setEmailStep('success');
      setEmailSuccessMsg('Email updated successfully!');
      setTimeout(() => {
        setChangeEmailDialogOpen(false);
        setEmailStep('input');
        setNewEmail('');
        setEmailCode('');
        setEmailSuccessMsg(null);
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setEmailError(err.response?.data?.detail || 'Invalid code or failed to update email.');
    } finally {
      setEmailLoading(false);
    }
  };

  const openProjectHandler = (project: Project) => {
    openProject(project.id);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
            <p className="text-muted-foreground">
              Ready to test some prompts and build amazing AI experiences?
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                  <DialogDescription>Manage your account and API keys.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">OpenRouter API Key</label>
                    <Input
                      type="text"
                      value={openrouterKey}
                      onChange={e => setOpenrouterKey(e.target.value)}
                      placeholder="sk-..."
                      disabled={saving}
                    />
                  </div>
                  <Button onClick={handleSaveKey} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Key'}
                  </Button>
                  {saveMsg && <div className="text-sm mt-2">{saveMsg}</div>}

                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-1">Account Email</label>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{user?.email}</span>
                      <Button variant="outline" size="sm" onClick={() => setChangeEmailDialogOpen(true)}>
                        Change Email
                      </Button>
                    </div>
                  </div>
                  <Dialog open={changeEmailDialogOpen} onOpenChange={setChangeEmailDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Account Email</DialogTitle>
                        <DialogDescription>Enter your new email address and verify it to update your account.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        {emailStep === 'input' && (
                          <div className="space-y-2">
                            <Label htmlFor="new-email">New Email</Label>
                            <Input
                              id="new-email"
                              type="email"
                              value={newEmail}
                              onChange={e => setNewEmail(e.target.value)}
                              placeholder="Enter new email"
                              disabled={emailLoading}
                            />
                            <Button
                              onClick={handleSendEmailVerification}
                              disabled={!newEmail || emailLoading}
                              className="w-full mt-2"
                            >
                              {emailLoading ? 'Sending...' : 'Send Verification Code'}
                            </Button>
                          </div>
                        )}
                        {emailStep === 'sent' && (
                          <div className="space-y-2">
                            <Label htmlFor="email-code">Verification Code</Label>
                            <Input
                              id="email-code"
                              type="text"
                              value={emailCode}
                              onChange={e => setEmailCode(e.target.value)}
                              placeholder="Enter code from email"
                              disabled={emailLoading}
                            />
                            <Button
                              onClick={handleVerifyEmailCode}
                              disabled={!emailCode || emailLoading}
                              className="w-full mt-2"
                            >
                              {emailLoading ? 'Verifying...' : 'Verify & Update Email'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleSendEmailVerification}
                              disabled={emailLoading}
                              className="w-full mt-2"
                            >
                              Resend Code
                            </Button>
                          </div>
                        )}
                        {emailStep === 'success' && (
                          <div className="text-green-600 text-center font-medium">{emailSuccessMsg}</div>
                        )}
                        {emailError && <div className="text-red-500 text-sm mt-2 text-center">{emailError}</div>}
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Close</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Avatar>
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prompts Created</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground">
                +15 from last week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests Run</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,429</div>
              <p className="text-xs text-muted-foreground">
                +201 from last week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% from last week
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Projects</h2>
            <Button onClick={() => setNewProjectDialogOpen(true)}>
              <FolderPlus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openProjectHandler(project)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge variant="secondary">
                      {project.promptCount} prompts
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(project.lastActivity).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 mr-1" />
                      {project.testCount} tests
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <NewProjectDialog 
        open={newProjectDialogOpen}
        onOpenChange={setNewProjectDialogOpen}
      />
    </div>
  );
}