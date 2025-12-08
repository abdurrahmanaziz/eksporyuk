import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, Settings, Zap, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface Integration {
  id: string;
  name: string;
  displayName: string;
  description: string;
  apiKey: string;
  apiSecret?: string;
  webhookUrl?: string;
  isActive: boolean;
  settings?: Record<string, any>;
}

const IntegrationsTable: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integrations');
      const data = await res.json();
      setIntegrations(data.integrations || []);
    } catch (error) {
      toast.error('Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  };

  const updateIntegration = async (integration: Integration) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/integrations/${integration.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integration),
      });

      if (res.ok) {
        toast.success(`${integration.displayName} updated successfully`);
        fetchIntegrations();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update integration');
      }
    } catch (error) {
      toast.error('Failed to update integration');
    } finally {
      setSaving(false);
    }
  };

  const testIntegration = async (integration: Integration) => {
    try {
      const res = await fetch(`/api/admin/integrations/${integration.id}/test`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          toast.success(`${integration.displayName} test successful`);
        } else {
          toast.error(data.error || 'Test failed');
        }
      } else {
        toast.error('Test failed');
      }
    } catch (error) {
      toast.error('Test failed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-gray-600">Configure third-party API integrations</p>
        </div>
      </div>

      <Tabs defaultValue="apis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="apis">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Globe className="w-4 h-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apis" className="space-y-4">
          {/* Giphy Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Giphy API
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Enable GIF search and embedding in posts
                  </p>
                </div>
                <Badge variant={
                  integrations.find(i => i.name === 'GIPHY')?.isActive 
                    ? 'default' 
                    : 'secondary'
                }>
                  {integrations.find(i => i.name === 'GIPHY')?.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <GiphyIntegrationForm 
                integration={integrations.find(i => i.name === 'GIPHY')}
                onUpdate={updateIntegration}
                onTest={testIntegration}
                saving={saving}
              />
            </CardContent>
          </Card>

          {/* Other integrations can be added here */}
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Webhook configurations coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Additional integration settings coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface GiphyFormProps {
  integration?: Integration;
  onUpdate: (integration: Integration) => void;
  onTest: (integration: Integration) => void;
  saving: boolean;
}

const GiphyIntegrationForm: React.FC<GiphyFormProps> = ({
  integration,
  onUpdate,
  onTest,
  saving
}) => {
  const [apiKey, setApiKey] = useState(integration?.apiKey || '');
  const [isActive, setIsActive] = useState(integration?.isActive || false);

  const handleSave = () => {
    const updatedIntegration: Integration = {
      id: integration?.id || 'giphy',
      name: 'GIPHY',
      displayName: 'Giphy API',
      description: 'GIF search and embedding',
      apiKey: apiKey.trim(),
      isActive,
      settings: {}
    };

    onUpdate(updatedIntegration);
  };

  const handleTest = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter API key first');
      return;
    }

    const testIntegration: Integration = {
      id: integration?.id || 'giphy',
      name: 'GIPHY',
      displayName: 'Giphy API',
      description: 'GIF search and embedding',
      apiKey: apiKey.trim(),
      isActive: true,
      settings: {}
    };

    onTest(testIntegration);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="giphy-enabled">Enable Giphy Integration</Label>
        <Switch
          id="giphy-enabled"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="giphy-api-key">API Key</Label>
        <Input
          id="giphy-api-key"
          type="password"
          placeholder="Enter your Giphy API key..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={saving}
        />
        <p className="text-xs text-gray-500">
          Get your API key from{' '}
          <a
            href="https://developers.giphy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Giphy Developers
          </a>
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={saving || !apiKey.trim()}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={saving || !apiKey.trim()}
        >
          Test API
        </Button>
      </div>
    </div>
  );
};

export default IntegrationsTable;