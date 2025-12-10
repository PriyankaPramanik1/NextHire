'use client';

import * as React from 'react';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '../utils/emotion-cache';

export default function MUIRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = React.useState(() => createEmotionCache());

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
