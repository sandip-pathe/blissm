import { Timestamp } from "firebase/firestore";

const formatDate = (timestamp: Timestamp | Date): string => {
  if (!timestamp) return "Unknown date";

  // Ensure timestamp is a Date object
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hr ago`;

  // Check if it's yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  // Show weekday if within the last 7 days
  if (diffInSeconds < 7 * 86400) {
    return date.toLocaleDateString("en-US", { weekday: "long" }); // Monday, Tuesday, etc.
  }

  // Show full date for older posts
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }); // Example: March 25, 2025
};

export default formatDate;
