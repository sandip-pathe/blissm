import PostHog from 'posthog-react-native'



export const posthog = new PostHog(
  'phc_6HZZECRL18wphTUSTyJ7mkFhxwFc7vUVd0ocrmlJKTX',
  {
    host: 'https://us.i.posthog.com',
    enableSessionReplay: true,
    sessionReplayConfig: {
      androidDebouncerDelayMs: 1000,
      captureLog: true,
      captureNetworkTelemetry: true,
    },
  },
);