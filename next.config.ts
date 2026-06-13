import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const config: NextConfig = {
  experimental: { instrumentationHook: true },
};

export default withSentryConfig(config, {
  silent: true,
  telemetry: false,
});
