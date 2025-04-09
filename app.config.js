export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      OPENAI_API: process.env.OPENAI_API, // pull from EAS secrets
    },
  };
};
