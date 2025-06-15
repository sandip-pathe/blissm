import { ContextDoc } from "../types/agents";

// Simulating RAG since we don't have a real vector DB
export const ragAgent = async (
  text: string,
  userId: string
): Promise<ContextDoc[]> => {
  // In a real app, you'd query a vector database here
  return [
    {
      content: "Our counseling services are available 24/7",
      source: "FAQ #123",
    },
    {
      content: "You can book appointments through our mobile app",
      source: "User Guide",
    },
  ];
};
