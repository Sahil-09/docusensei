//@ts-check
import { withSentryConfig } from "@sentry/nextjs";
import { withNx } from '@nx/next/plugins/with-nx';


/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js options go here
  output:'standalone',
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js
};

export default withSentryConfig(withNx(nextConfig), {
  org: 'hobby-ch0',
  project: 'docusensei',
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
});
