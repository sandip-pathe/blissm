import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

const PostCreationPage = () => {
  const [postType, setPostType] = useState("Question");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState(null);
  const { colors } = useTheme();
  const styles = themedStyles(colors);

  const uploadMedia = async (uri, type) => {
    if (!uri) return null;
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in to upload media.");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const storage = getStorage();
      const mediaRef = ref(storage, `posts/${user.uid}/${Date.now()}`);

      // Convert URI to Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(mediaRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            setIsUploading(false);
            Alert.alert("Upload Failed", error.message);
            reject(error);
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setUploadedMediaUrl(downloadUrl);
            setIsUploading(false);
            setUploadProgress(null);
            resolve(downloadUrl);
          }
        );
      });
    } catch (error) {
      setIsUploading(false);
      Alert.alert("Error", "Failed to upload media.");
      return null;
    }
  };

  // Function to Handle Post
  const handlePost = async () => {
    setIsSubmitting(true);
    if (!postType || !title || !content) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in to create a post.");
      return;
    }

    let finalMediaUrl = uploadedMediaUrl;
    if (mediaUri && !uploadedMediaUrl) {
      finalMediaUrl = await uploadMedia(mediaUri, mediaType);
    }

    const newPost = {
      title,
      content,
      type: postType,
      date: Timestamp.now().toDate().toISOString(),
      likes: 0,
      uid: user.uid,
      ...(finalMediaUrl && { mediaUrl: finalMediaUrl }),
      ...(mediaType && { mediaType }),
    };

    try {
      const db = getFirestore();
      await addDoc(collection(db, "community"), newPost);
      resetForm();
      router.push("../(tabs)/community");
    } catch (error) {
      console.error("Error adding post:", error);
      Alert.alert("Error", "Failed to add post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to Pick Media
  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: false,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaType(
        asset.type || (asset.uri.endsWith(".mp4") ? "video" : "image")
      );

      // Upload media immediately
      uploadMedia(asset.uri, asset.type);
    }
  };

  // Function to Remove Media
  const removeMedia = () => {
    setMediaUri(null);
    setMediaType(null);
    setUploadedMediaUrl(null);
    setUploadProgress(0);
  };
  const resetForm = () => {
    setTitle("");
    setContent("");
    setMediaUri(null);
    setMediaType(null);
    setPostType("Question");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Create a Post</Text>

      <View style={styles.tabBar}>
        {["Question", "Story", "Coping", "Confession"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, postType === tab && styles.activeTab]}
            onPress={() => setPostType(tab)}
          >
            <Text
              style={[styles.tabText, postType === tab && styles.activeTabText]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        placeholder="Title"
        placeholderTextColor={colors.border}
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        cursorColor={colors.primary}
      />

      <TextInput
        placeholder="What's on your mind?"
        placeholderTextColor={colors.border}
        value={content}
        onChangeText={setContent}
        multiline
        style={styles.contentInput}
        cursorColor={colors.primary}
        textAlignVertical="top"
      />

      <View style={styles.mediaContainer}>
        {mediaUri ? (
          <View style={styles.mediaPreviewContainer}>
            {mediaType === "image" ? (
              <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
            ) : (
              <View style={[styles.mediaPreview, styles.videoPlaceholder]}>
                <Ionicons name="videocam" size={40} color={colors.text} />
              </View>
            )}
            {uploadProgress !== null && (
              <View style={styles.uploadProgressContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.uploadProgressText}>
                  {Math.round(uploadProgress)}%
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeMediaButton}
              onPress={removeMedia}
              disabled={uploadProgress !== null}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addMediaButton} onPress={pickMedia}>
            <Ionicons name="add" size={24} color={colors.primary} />
            <Text style={styles.addMediaText}>Add Photo/Video</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={handlePost}
        style={styles.submitButton}
        disabled={isSubmitting || isUploading}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.submitButtonText}>Post</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const themedStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },
    heading: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 20,
    },
    tabBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 5,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: "center",
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      color: colors.text,
      fontWeight: "600",
    },
    activeTabText: {
      color: "#fff",
    },
    input: {
      backgroundColor: colors.card,
      color: colors.text,
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      fontSize: 16,
    },
    contentInput: {
      backgroundColor: colors.card,
      color: colors.text,
      padding: 15,
      borderRadius: 10,
      height: 150,
      marginBottom: 15,
      fontSize: 16,
      textAlignVertical: "top",
    },
    mediaContainer: {
      marginBottom: 20,
    },
    addMediaButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 15,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      borderStyle: "dashed",
    },
    addMediaText: {
      marginLeft: 10,
      color: colors.primary,
      fontWeight: "500",
    },
    mediaPreviewContainer: {
      position: "relative",
    },
    mediaPreview: {
      width: "auto",
      height: 200,
      borderRadius: 10,
    },
    videoPlaceholder: {
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
    },
    removeMediaButton: {
      position: "absolute",
      top: 10,
      right: 10,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 15,
      width: 30,
      height: 30,
      justifyContent: "center",
      alignItems: "center",
    },
    submitButton: {
      backgroundColor: colors.primary,
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      height: 50,
    },
    submitButtonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 16,
    },
    uploadProgressContainer: {
      position: "absolute",
      top: "40%",
      left: "40%",
      alignItems: "center",
    },
    uploadProgressText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "bold",
    },
  });

export default PostCreationPage;
