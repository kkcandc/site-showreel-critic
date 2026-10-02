import { SiteApp } from './site/SiteApp';
import { StagePage } from './stage/StagePage';

export function App() {
  const stage = new URLSearchParams(window.location.search).has('stage');
  if (stage) return <StagePage />;
  return <SiteApp />;
}
