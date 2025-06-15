export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      OPENAI_API: process.env.OPENAI_API,
      GEMINI_API: process.env.GEMINI_API,
    },
  };
};
