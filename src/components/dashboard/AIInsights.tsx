import { useState } from 'react';
import { Sparkles, Copy, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateContentIdea, generateCaption, generateHashtags } from '../../services/aiService';
import SubscriptionGate from '@/components/SubscriptionGate';
import { useAuth } from '@/hooks/useAuth';

type Mode = 'ideas' | 'caption' | 'hashtags';

const modes: { id: Mode; label: string }[] = [
  { id: 'ideas', label: '💡 Content Ideas' },
  { id: 'caption', label: '✍️ Caption' },
  { id: 'hashtags', label: '#️⃣ Hashtags' },
];

function AIInsightsInner() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('ideas');
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setResult('');
    try {
      let text = '';
      if (mode === 'ideas') text = await generateContentIdea(user!.id, topic);
      else if (mode === 'caption') text = await generateCaption(user!.id, platform, topic);
      else text = await generateHashtags(user!.id, topic);
      setResult(text);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'SUBSCRIPTION_REQUIRED') {
        setResult('⚠️ Active subscription required to use AI features.');
      } else {
        setResult('Error generating content. Please check your API key.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">AI Insights</h2>
      <Card>
        <CardHeader>
          <CardTitle>AI Content Generator</CardTitle>
          <CardDescription>Powered by OpenAI GPT</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={[
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                  mode === m.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-foreground',
                ].join(' ')}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {mode === 'caption' && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                >
                  {['Instagram', 'Twitter', 'LinkedIn', 'Facebook'].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Topic / Keyword</label>
              <Input
                placeholder={
                  mode === 'ideas'
                    ? 'e.g. summer sale'
                    : mode === 'caption'
                    ? 'e.g. product launch'
                    : 'e.g. digital marketing'
                }
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <Button onClick={generate} disabled={loading} className="self-start gap-2">
              <Sparkles size={16} />
              {loading ? 'Generating…' : 'Generate'}
            </Button>
          </div>
          {result && (
            <div className="mt-2 rounded-lg bg-muted border border-border p-4">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{result}</pre>
              <div className="flex gap-2 mt-3">
                <Button variant="secondary" size="sm" onClick={copyResult} className="gap-1">
                  <Copy size={14} />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="ghost" size="sm" onClick={generate} className="gap-1">
                  <RefreshCw size={14} />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AIInsights() {
  return (
    <SubscriptionGate featureName="AI Insights">
      <AIInsightsInner />
    </SubscriptionGate>
  );
}
