import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://ce62a56e5089fe269d3ce92f4651f5fa@o4511767388880896.ingest.de.sentry.io/4511767404675152',
  // Capture 100% in development, 10% in production
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  // Enable Session Replay for troubleshooting UX issues (optional)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
