import type { ReactNode } from 'react';

interface PanelProps {
  id: string;
  title: string;
  caption: string;
  icon: ReactNode;
  children: ReactNode;
}

export function Panel({ id, title, caption, icon, children }: PanelProps) {
  return (
    <section className={`panel ${id}`} aria-labelledby={`${id}-title`}>
      <div className="panel-heading"><div className="panel-title">{icon}<h2 id={`${id}-title`}>{title}</h2></div><span>{caption}</span></div>
      {children}
    </section>
  );
}
