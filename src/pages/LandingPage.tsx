import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <span className="text-xl font-bold text-brand-600">Agency AAA</span>
        <div className="flex items-center gap-3">
          <Link to="/signin">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/signup">
            <Button>Get Started Free</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          AI-Powered Social Media
          <br />
          <span className="text-brand-500">Management for Agencies</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Schedule posts, generate AI captions, track analytics, and manage all
          your clients' social accounts — all in one place.
        </p>
        <Link to="/signup">
          <Button size="lg">Start for Free →</Button>
        </Link>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-400">
        © {new Date().getFullYear()} Agency AAA. All rights reserved.
      </footer>
    </div>
  );
}

const features = [
  {
    icon: '🤖',
    title: 'AI Content Generation',
    description:
      'Generate engaging captions, hashtags, and content ideas with GPT-powered AI.',
  },
  {
    icon: '📅',
    title: 'Content Calendar',
    description:
      'Plan, schedule, and publish posts across all social platforms from one dashboard.',
  },
  {
    icon: '📊',
    title: 'Analytics & Insights',
    description:
      'Track impressions, reach, and engagement across all connected social accounts.',
  },
];
