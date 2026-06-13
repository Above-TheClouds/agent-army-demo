import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const config: NextConfig = {};

export default withSentryConfig(config, {
  silent: true,
  telemetry: false,
});
