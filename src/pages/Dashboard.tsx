import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Zap,
  Sparkles,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';
import Tabs from '../components/ui/Tabs';
import Overview from '../components/dashboard/Overview';
import ContentCalendar from '../components/dashboard/ContentCalendar';
import ActionCenter from '../components/dashboard/ActionCenter';
import AIInsights from '../components/dashboard/AIInsights';
import Analytics from '../components/dashboard/Analytics';
import Settings from '../components/dashboard/Settings';
import { useAuth } from '../hooks/useAuth';

const tabs = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar size={16} /> },
  { id: 'actions', label: 'Action Center', icon: <Zap size={16} /> },
  { id: 'ai', label: 'AI Insights', icon: <Sparkles size={16} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={16} /> },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-bold text-brand-600">Agency AAA</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {user?.full_name ?? user?.email}
          </span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Tabs tabs={tabs} defaultTab="overview">
          {(active) => (
            <>
              {active === 'overview' && <Overview />}
              {active === 'calendar' && <ContentCalendar />}
              {active === 'actions' && <ActionCenter />}
              {active === 'ai' && <AIInsights />}
              {active === 'analytics' && <Analytics />}
              {active === 'settings' && <Settings />}
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}
