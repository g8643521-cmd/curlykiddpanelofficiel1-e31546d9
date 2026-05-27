import { useEffect, type ReactNode } from 'react';
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { RootErrorBoundary } from '@/components/RootErrorBoundary';
import '@/index.css';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { property: 'og:site_name', content: 'CurlyKiddPanel' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { title: "CurlyKiddPanel — FiveM Server Lookup" },
      { property: "og:title", content: "CurlyKiddPanel" },
      { name: "twitter:title", content: "CurlyKiddPanel" },
      { name: "description", content: "Advanced FiveM server analytics, player tracking and community cheater database — a complete operations toolkit for FiveM communities." },
      { property: "og:description", content: "Advanced FiveM server analytics, player tracking and community cheater database — a complete operations toolkit for FiveM communities." },
      { name: "twitter:description", content: "Advanced FiveM server analytics, player tracking and community cheater database — a complete operations toolkit for FiveM communities." },
    ],
    links: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'CurlyKiddPanel',
          url: 'https://curlykiddpanelofficiel1.lovable.app',
        }),
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'CurlyKiddPanel',
          url: 'https://curlykiddpanelofficiel1.lovable.app',
        }),
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: SpaRoute,
});

function RootComponent() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      // Allow native context menu inside editable fields so users can still copy/paste text.
      if (target?.closest('input, textarea, [contenteditable="true"]')) return;
      // Allow components that opt-in to a custom context menu (e.g. Radix ContextMenu trigger).
      if (target?.closest('[data-allow-context-menu="true"], [data-radix-context-menu-trigger]')) return;
      e.preventDefault();
    };
    window.addEventListener('contextmenu', onContextMenu);
    return () => window.removeEventListener('contextmenu', onContextMenu);
  }, []);

  return (
    <RootDocument>
      <RootErrorBoundary>
        <Outlet />
      </RootErrorBoundary>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function SpaRoute() {
  return <div id="spa-root" />;
}
