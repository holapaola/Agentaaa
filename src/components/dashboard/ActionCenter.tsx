import { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ActionItem } from '../../types';

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

const sampleItems: ActionItem[] = [
  { id: '1', user_id: '', title: 'Review and approve Instagram posts for next week', priority: 'high', completed: false, due_date: 'Mar 14', created_at: '' },
  { id: '2', user_id: '', title: 'Send monthly analytics report to clients', priority: 'high', completed: false, due_date: 'Mar 15', created_at: '' },
  { id: '3', user_id: '', title: 'Create new brand hashtag strategy', priority: 'medium', completed: false, due_date: 'Mar 18', created_at: '' },
  { id: '4', user_id: '', title: 'Update bio links across all profiles', priority: 'low', completed: true, due_date: 'Mar 12', created_at: '' },
];

export default function ActionCenter() {
  const [items, setItems] = useState<ActionItem[]>(sampleItems);

  function toggle(id: string) {
    setItems((prev) =>
      prev.map((item) => item.id === id ? { ...item, completed: !item.completed } : item)
    );
  }

  const pending = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Action Center</h2>
      <Card>
        <CardHeader>
          <CardTitle>Pending Actions</CardTitle>
          <CardDescription>{pending.length} tasks need your attention</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {pending.map((item) => (
              <ActionRow key={item.id} item={item} onToggle={toggle} />
            ))}
            {pending.length === 0 && (
              <p className="text-sm text-muted-foreground">All caught up! 🎉</p>
            )}
          </ul>
        </CardContent>
      </Card>
      {done.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {done.map((item) => (
                <ActionRow key={item.id} item={item} onToggle={toggle} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ActionRow({ item, onToggle }: { item: ActionItem; onToggle: (id: string) => void }) {
  return (
    <li className="flex items-start gap-3 py-2">
      <button onClick={() => onToggle(item.id)} className="mt-0.5 shrink-0">
        {item.completed ? (
          <CheckCircle2 size={18} className="text-green-500" />
        ) : (
          <Circle size={18} className="text-muted-foreground hover:text-foreground transition-colors" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {item.title}
        </p>
        {item.due_date && (
          <p className="text-xs text-muted-foreground mt-0.5">Due: {item.due_date}</p>
        )}
      </div>
      <span className={`shrink-0 text-xs rounded-full px-2 py-0.5 font-medium ${priorityColors[item.priority]}`}>
        {item.priority}
      </span>
    </li>
  );
}
