import { useState } from 'react';
import { Sparkles, Copy, RefreshCw } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { generateContentIdea, generateCaption, generateHashtags } from '../../services/aiService';

type Mode = 'ideas' | 'caption' | 'hashtags';

const modes: { id: Mode; label: string }[] = [
  { id: 'ideas', label: '💡 Content Ideas' },
  { id: 'caption', label: '✍️ Caption' },
  { id: 'hashtags', label: '#️⃣ Hashtags' },
];

export default function AIInsights() {
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
      if (mode === 'ideas') text = await generateContentIdea(topic);
      else if (mode === 'caption') text = await generateCaption(platform, topic);
      else text = await generateHashtags(topic);
      setResult(text);
    } catch {
      setResult('Error generating content. Please check your API key.');
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
      <h2 className="text-2xl font-bold text-gray-900">AI Insights</h2>

      <Card>
        <CardHeader
          title="AI Content Generator"
          description="Powered by OpenAI GPT"
        />

        {/* Mode selector */}
        <div className="flex gap-2 flex-wrap mb-4">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                mode === m.id
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
              ].join(' ')}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {mode === 'caption' && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {['Instagram', 'Twitter', 'LinkedIn', 'Facebook'].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          )}
          <Input
            label="Topic / Keyword"
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
          <Button onClick={generate} loading={loading} className="self-start">
            <Sparkles size={16} />
            Generate
          </Button>
        </div>

        {result && (
          <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-4 relative">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
              {result}
            </pre>
            <div className="flex gap-2 mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={copyResult}
              >
                <Copy size={14} />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant="ghost" size="sm" onClick={generate}>
                <RefreshCw size={14} />
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
