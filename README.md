# 🌱 Blissm - Mental Health Companion

*A Modern Mental Health App for Peace and Self-Reflection*

Blissm is a mental health app designed to bring peace, self-reflection, and emotional resilience into everyday life. Unlike traditional journaling apps, Blissm leverages AI-powered reflections, habit nudges, and personalized mental wellness insights to create a safe digital space for the mind.

## ✨ Features

-   **📝 Smart Journaling:** Guided prompts with AI-assisted reflection and summary.
-   **🔐 Privacy First:** End-to-end encryption for all journals & personal notes.
-   **📊 Mood & Habit Analytics:** Personalized dashboard with insights on your emotional trends, triggers, and growth.
-   **🤝 Community Circles (Optional):** Find support and shared experiences in anonymous, topic-based groups.
-   **🌱 Personalized Nudges:** Get gentle reminders and habit-forming activities tailored to your wellness journey.

## 🛠 Tech Stack

-   **Frontend:** React Native (TypeScript), Expo
-   **Backend & Database:** Firebase (Auth, Firestore, Cloud Functions)
-   **AI Layer:** OpenAI API + LangChain for journaling insights and suggestions
-   **State Management:** Zustand
-   **Storage:** Encrypted local storage for user data

## 🚀 Getting Started

### Prerequisites

-   Node.js
-   npm or yarn
-   Expo CLI (`npm install -g expo-cli`)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/sandip-pathe/blissm.git
    cd blissm
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm start
    # or
    expo start
    ```

4.  Scan the QR code with the Expo Go app on your iOS/Android device, or run on a simulator.

### Building for Production

```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios
