import { Users, FileText, TrendingUp, Zap } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';

const stats = [
  {
    label: 'Connected Accounts',
    value: '4',
    icon: Users,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    label: 'Scheduled Posts',
    value: '12',
    icon: FileText,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    label: 'Total Impressions',
    value: '84.2K',
    icon: TrendingUp,
    color: 'text-green-500',
    bg: 'bg-green-50',
  },
  {
    label: 'Pending Actions',
    value: '5',
    icon: Zap,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
];

export default function Overview() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Overview</h2>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${s.bg}`}>
                <s.icon className={s.color} size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader title="Recent Activity" />
        <ul className="divide-y divide-gray-100">
          {activities.map((a, i) => (
            <li key={i} className="py-3 flex items-start gap-3">
              <span className="text-lg">{a.icon}</span>
              <div>
                <p className="text-sm text-gray-800">{a.text}</p>
                <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

const activities = [
  { icon: '📸', text: 'Instagram post scheduled for tomorrow 10:00 AM', time: '2 minutes ago' },
  { icon: '🤖', text: 'AI generated 3 content ideas for "Summer Campaign"', time: '1 hour ago' },
  { icon: '📊', text: 'Weekly analytics report is ready', time: '3 hours ago' },
  { icon: '✅', text: 'LinkedIn post published successfully', time: 'Yesterday at 2:30 PM' },
];
