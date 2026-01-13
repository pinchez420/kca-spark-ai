import React, { useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Thermometer, FileText, Zap } from 'lucide-react';

interface ChatSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatSettings({ open, onOpenChange }: ChatSettingsProps) {
  const { settings, updateSettings } = useChat();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    onOpenChange(false);
  };

  const handleReset = () => {
    const defaults = {
      temperature: 0.7,
      max_tokens: 1024,
      system_prompt: `You are KCA Connect AI, an intelligent assistant for KCA University students. 
You help with questions about:
- Timetables and class schedules
- Fee structures and payments
- Exam schedules and results
- Campus facilities and services
- Academic programs and requirements
- General university information

Be helpful, friendly, and concise. If you don't know something, say so honestly.`
    };
    setLocalSettings(defaults);
  };

  const handleChange = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Settings
          </DialogTitle>
          <DialogDescription>
            Configure how KCA Connect AI responds to your queries
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              System Prompt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 py-4">
            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Temperature
                </Label>
                <span className="text-sm text-muted-foreground">
                  {localSettings.temperature.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[localSettings.temperature]}
                onValueChange={([value]) => handleChange('temperature', value)}
                min={0}
                max={2}
                step={0.1}
                className="py-2"
              />
              <p className="text-xs text-muted-foreground">
                Lower values produce more focused responses, higher values allow more creativity
              </p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <span className="text-sm text-muted-foreground">
                  {localSettings.max_tokens}
                </span>
              </div>
              <Slider
                value={[localSettings.max_tokens]}
                onValueChange={([value]) => handleChange('max_tokens', value)}
                min={256}
                max={4096}
                step={128}
                className="py-2"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of tokens in AI responses (longer = more detailed)
              </p>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <textarea
                id="systemPrompt"
                value={localSettings.system_prompt}
                onChange={(e) => handleChange('system_prompt', e.target.value)}
                className="w-full min-h-[200px] p-3 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter the system prompt that defines AI behavior..."
              />
              <p className="text-xs text-muted-foreground">
                This defines how the AI behaves and what information it has access to
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ChatSettings;

