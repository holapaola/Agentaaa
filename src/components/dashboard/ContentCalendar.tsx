import { useState } from 'react';
import { Plus, Instagram, Twitter, Linkedin } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import Button from '../ui/Button';

interface Post {
  id: number;
  platform: 'instagram' | 'twitter' | 'linkedin';
  content: string;
  date: string;
  status: 'scheduled' | 'draft' | 'published';
}

const platformIcons = {
  instagram: <Instagram size={14} />,
  twitter: <Twitter size={14} />,
  linkedin: <Linkedin size={14} />,
};

const platformColors = {
  instagram: 'bg-pink-100 text-pink-700',
  twitter: 'bg-sky-100 text-sky-700',
  linkedin: 'bg-blue-100 text-blue-700',
};

const statusColors = {
  scheduled: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-purple-100 text-purple-700',
};

const samplePosts: Post[] = [
  {
    id: 1,
    platform: 'instagram',
    content: 'Excited to share our latest case study! 🚀',
    date: 'Mar 15',
    status: 'scheduled',
  },
  {
    id: 2,
    platform: 'twitter',
    content: 'Hot take: consistency beats viral content every time.',
    date: 'Mar 16',
    status: 'draft',
  },
  {
    id: 3,
    platform: 'linkedin',
    content: 'We helped 3 clients grow their audience by 40% this quarter.',
    date: 'Mar 17',
    status: 'scheduled',
  },
];

export default function ContentCalendar() {
  const [posts, setPosts] = useState<Post[]>(samplePosts);

  function handleDelete(id: number) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Content Calendar</h2>
        <Button size="sm">
          <Plus size={16} />
          New Post
        </Button>
      </div>

      <Card padding={false}>
        <CardHeader
          title="Upcoming Posts"
          description="Your scheduled and draft content"
          action={<span className="text-sm text-gray-400">{posts.length} posts</span>}
        />
        {posts.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-gray-500">
            No posts yet. Click "New Post" to add one.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {posts.map((post) => (
              <li key={post.id} className="px-6 py-4 flex items-start gap-4">
                <div
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${platformColors[post.platform]}`}
                >
                  {platformIcons[post.platform]}
                  {post.platform}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{post.content}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{post.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 font-medium ${statusColors[post.status]}`}
                  >
                    {post.status}
                  </span>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
