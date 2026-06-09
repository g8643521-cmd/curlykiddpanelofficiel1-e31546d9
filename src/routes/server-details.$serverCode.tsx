import { createFileRoute } from '@tanstack/react-router';
import { SpaRoute } from './-SpaRoute';

export const Route = createFileRoute('/server-details/$serverCode')({
  component: SpaRoute,
  head: ({ params }) => {
    const url = `https://curlykiddpanelofficiel1.lovable.app/server-details/${params.serverCode}`;
    const title = `Server Details — cfx.re/join/${params.serverCode}`;
    const desc = `FiveM server details for cfx.re/join/${params.serverCode}.`;
    return {
      meta: [
        { title },
        { name: 'description', content: desc },
        { name: 'robots', content: 'noindex, nofollow' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: desc },
        { property: 'og:url', content: url },
      ],
      links: [{ rel: 'canonical', href: url }],
    };
  },
});
