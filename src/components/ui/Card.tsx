import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  padding?: boolean;
}

export function Card({ className = '', children, padding = true }: CardProps) {
  return (
    <div
      className={[
        'bg-white rounded-xl shadow-sm border border-gray-100',
        padding ? 'p-6' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="ml-4 shrink-0">{action}</div>}
    </div>
  );
}
