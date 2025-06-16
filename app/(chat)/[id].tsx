export { default } from "./ChatScreen";

// const startRecording = async () => {
//   try {
//     const perm = await Audio.requestPermissionsAsync();
//     if (!perm.granted) throw new Error("Mic permission denied");
//     await Audio.setAudioModeAsync({
//       allowsRecordingIOS: true,
//       playsInSilentModeIOS: true,
//     });

//     console.log("⌛ Preparing recording");
//     const { recording } = await Audio.Recording.createAsync(
//       Audio.RecordingOptionsPresets.HIGH_QUALITY
//     );
//     setRecording(recording);
//     setIsRecording(true);

//     recording.setOnRecordingStatusUpdate((status) => {
//       console.log("[RecordingStatus]", status.durationMillis);
//     });
//     console.log("✅ Recording started");
//   } catch (e) {
//     console.error("Start recording error", e);
//     Alert.alert("Error", e.message);
//   }
// };

// const stopRecording = async (): Promise<string | null> => {
//   if (!recording) return null;
//   try {
//     console.log("⏹️ Stopping recording");
//     await recording.stopAndUnloadAsync();
//     await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
//     const uri = recording.getURI();
//     setRecording(null);
//     setIsRecording(false);
//     console.log("📁 Recording stopped, URI:", uri);
//     return uri ?? null;
//   } catch (e) {
//     console.error("Stop recording error", e);
//     return null;
//   }
// };

// async function startGeminiLiveSTT() {
//   const uri = await stopRecording();
//   if (!uri) return;

//   const buffer = await FileSystem.readAsStringAsync(uri, {
//     encoding: "base64",
//   });
//   const audioBytes = Buffer.from(buffer, "base64");

//   const ws = new WebSocket(
//     `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GCP_Project_API}`
//   );

//   ws.onopen = () => {
//     ws.send(
//       JSON.stringify({
//         setup: {
//           model:
//             "projects/PROJECT/locations/LOCATION/publishers/google/models/gemini-2.0-flash-live-001",
//           generationConfig: { response_modalities: ["TEXT"] },
//           realtimeInputConfig: {},
//           inputAudioTranscription: {},
//         },
//       })
//     );

//     ws.send(
//       JSON.stringify({
//         realtimeInput: { audio: audioBytes },
//       })
//     );
//   };

//   ws.onmessage = (evt) => {
//     const msg = JSON.parse(evt.data);
//     if (msg.serverContent?.parts) {
//       const text = msg.serverContent.parts[0].text;
//       console.log("📝 Gemini STT interim:", text);
//     }
//     if (msg.setupComplete) {
//       console.log("✅ Setup complete");
//     }
//     if (msg.serverContent?.turnComplete) {
//       console.log("🎉 Gemini STT final transcript complete");
//       ws.close();
//     }
//   };

//   ws.onerror = (err) => {
//     console.error("WS error", err);
//     ws.close();
//   };
// }
