import "dotenv/config";

export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      OPENAI_API: process.env.OPENAI_API,
      GEMINI_API: process.env.GEMINI_API,
      GCP_Project_API: process.env.GCP_Project_API,
      GOOGLE_SPEECH_API_KEY: process.env.GOOGLE_SPEECH_API_KEY,
      GOOGLE_TTS_API_KEY: process.env.GOOGLE_TTS_API_KEY,
    },
  };
};
