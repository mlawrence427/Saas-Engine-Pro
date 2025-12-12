// frontend/components/dashboard/SectionCard.tsx
'use client';

import type { ReactNode } from 'react';

type SectionCardProps = {
  title: string;
  description?: string;
  badge?: string;
  children?: ReactNode;
};

export function SectionCard({
  title,
  description,
  badge,
  children,
}: SectionCardProps) {
  return (
    <div className="border border-gray-800 bg-gray-950 px-4 py-4 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-mono text-gray-100">{title}</h2>
          {badge ? (
            <span className="text-[10px] uppercase tracking-wide font-mono border border-gray-700 px-2 py-[2px] text-gray-400">
              {badge}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="text-[11px] text-gray-400 font-mono">{description}</p>
        ) : null}
      </div>

      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

