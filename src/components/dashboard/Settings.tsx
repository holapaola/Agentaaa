import { useState } from 'react';
import { Instagram, Twitter, Linkedin, Check } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAuth } from '../../hooks/useAuth';

interface AccountRow {
  platform: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
}

const initialAccounts: AccountRow[] = [
  {
    platform: 'Instagram',
    icon: <Instagram size={18} />,
    color: 'text-pink-500',
    connected: true,
  },
  {
    platform: 'Twitter / X',
    icon: <Twitter size={18} />,
    color: 'text-sky-500',
    connected: true,
  },
  {
    platform: 'LinkedIn',
    icon: <Linkedin size={18} />,
    color: 'text-blue-600',
    connected: false,
  },
];

export default function Settings() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [saved, setSaved] = useState(false);

  function toggleAccount(platform: string) {
    setAccounts((prev) =>
      prev.map((a) =>
        a.platform === platform ? { ...a, connected: !a.connected } : a
      )
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      {/* Profile */}
      <Card>
        <CardHeader title="Profile" description="Update your account details" />
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            defaultValue={user?.full_name ?? ''}
            placeholder="Your name"
          />
          <Input
            label="Email"
            type="email"
            defaultValue={user?.email ?? ''}
            disabled
            helperText="Email cannot be changed here"
          />
          <Button type="submit" className="self-start" loading={false}>
            {saved ? (
              <>
                <Check size={16} />
                Saved!
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </form>
      </Card>

      {/* Social accounts */}
      <Card>
        <CardHeader
          title="Social Accounts"
          description="Connect or disconnect your social media profiles"
        />
        <ul className="divide-y divide-gray-100">
          {accounts.map((a) => (
            <li key={a.platform} className="py-3 flex items-center justify-between">
              <div className={`flex items-center gap-2 font-medium text-sm ${a.color}`}>
                {a.icon}
                {a.platform}
              </div>
              <Button
                variant={a.connected ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => toggleAccount(a.platform)}
              >
                {a.connected ? 'Disconnect' : 'Connect'}
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
