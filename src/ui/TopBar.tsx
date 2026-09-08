import type { ReactNode } from 'react';

export interface TopBarProps {
  marca: ReactNode;
  acciones?: ReactNode;
}

/** Barra superior pegajosa. La usan PublicLayout (landing) y PortalLayout (portal). */
export function TopBar({ marca, acciones }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between gap-3 px-4 lg:h-16 lg:px-6">
        {marca}
        {acciones ? <div className="flex items-center gap-2">{acciones}</div> : null}
      </div>
    </header>
  );
}
