// Simulating STT since we don't have a real implementation
export const sttAgent = async (
  audioBlob: Blob
): Promise<{ text: string; confidence: number }> => {
  // In a real app, you would send the audio to a STT service
  // For simulation, we'll return a hardcoded response
  return {
    text: "Hello, I'd like to know more about your services",
    confidence: 0.92,
  };
};
