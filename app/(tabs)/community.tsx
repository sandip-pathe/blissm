import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Text,
  TextInput,
  Image,
  ActivityIndicator,
  Button,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";

import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { FIRESTORE_DB } from "@/constants/firebaseConf";
import formatDate from "@/constants/utils";
import { useEvent } from "expo";

const PostCard = ({ item, colors, router, expandedPosts, toggleExpand }) => {
  const styles = themedStyles(colors);
  const hasMedia = item.mediaUrl && item.mediaType;

  return (
    <TouchableOpacity
      onPress={() => router.navigate(`../(community)/${item.id}`)}
      style={[styles.postCard, styles[item.type.toLowerCase()]]}
      activeOpacity={0.8}
    >
      <View style={styles.postHeader}>
        <Text style={[styles.postType, typeStyles[item.type]]}>
          {item.type}
        </Text>
        <Text style={styles.postDate}>
          {formatDate(item.date) || "Unknown Date"}
        </Text>
      </View>

      <Text numberOfLines={2} style={styles.postTitle}>
        {item.title || "Untitled Post"}
      </Text>

      {hasMedia && (
        <View style={styles.mediaContainer}>
          {item.mediaType.startsWith("image") ? (
            <Image
              source={{ uri: item.mediaUrl }}
              style={styles.media}
              resizeMode="cover"
            />
          ) : (
            <>
              <VideoView
                style={styles.media}
                player={useVideoPlayer(item.mediaUrl, (player) => {
                  player.loop = true;
                  player.play();
                })}
                allowsFullscreen
                allowsPictureInPicture
              />
              <View>
                <Button title={true ? "Pause" : "Play"} />
              </View>
            </>
          )}
        </View>
      )}

      <Text
        numberOfLines={expandedPosts[item.id] ? undefined : 3}
        style={styles.postContent}
      >
        {item.content}
      </Text>

      {item.content.length > 200 && (
        <TouchableOpacity onPress={() => toggleExpand(item.id)}>
          <Text style={styles.moreButton}>
            {expandedPosts[item.id] ? "Show Less" : "Read More"}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.postFooter}>
        <View style={styles.reactionContainer}>
          <Ionicons name="heart-outline" size={16} color={colors.text} />
          <Text style={styles.reactionText}>{item.likes || 0}</Text>
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={colors.text}
            style={styles.commentIcon}
          />
          <Text style={styles.reactionText}>{item.comments?.length || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  mediaUrl?: string;
  mediaType?: string;
  date: string;
  likes?: number;
  comments?: Array<any>;
}

const CommunityScreen: React.FC = () => {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  const [expandedPosts, setExpandedPosts] = useState({});

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const querySnapshot = await getDocs(
          query(collection(FIRESTORE_DB, "community"), orderBy("date", "desc"))
        );
        const fetchedPosts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error.message || error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchesTab = activeTab === "All" || post.type === activeTab;
    const matchesQuery =
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatDate(post.date).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  const toggleExpand = (postId) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search names, dates . . ."
          placeholderTextColor={colors.border}
          style={styles.searchInput}
          value={searchQuery}
          cursorColor={colors.text}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.navigate("../(community)/new")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {["All", "Question", "Story", "Coping", "Confession"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredPosts}
        renderItem={({ item }) => (
          <PostCard
            item={item}
            colors={colors}
            router={router}
            expandedPosts={expandedPosts}
            toggleExpand={toggleExpand}
          />
        )}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.feedContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color={colors.border}
            />
            <Text style={styles.noPostsText}>No posts found</Text>
            <Text style={styles.noPostsSubtext}>
              {searchQuery ? "Try a different search" : "Be the first to post!"}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => (
          <View style={{ height: 10, backgroundColor: colors.background }} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default CommunityScreen;

const themedStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
    },
    headerTitle: {
      fontSize: 28,
      fontFamily: "Poppins-Bold",
      color: colors.text,
    },
    searchContainer: {
      gap: 10,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 20,
      marginVertical: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 18,
      color: colors.text,
      paddingVertical: 10,
      marginHorizontal: 10,
      fontFamily: "Poppins-Regular",
    },
    tabBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 8,
      alignItems: "center",
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      color: colors.text,
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
    },
    activeTabText: {
      color: "#fff",
    },
    feedContainer: {
      paddingBottom: 80,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 80,
    },
    postCard: {
      backgroundColor: colors.card,
    },
    postHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    postType: {
      fontFamily: "Poppins-Bold",
      fontSize: 12,
      textTransform: "uppercase",
    },
    postTitle: {
      marginBottom: 12,
      color: colors.text,
      fontFamily: "Poppins-Bold",
      fontSize: 18,
      lineHeight: 24,
      paddingHorizontal: 16,
    },
    mediaContainer: {
      width: "100%",
      height: 500,
      overflow: "hidden",
      marginBottom: 12,
    },
    media: {
      width: "100%",
      height: "100%",
    },
    postContent: {
      fontSize: 15,
      marginBottom: 8,
      color: colors.text,
      fontFamily: "Poppins-Regular",
      lineHeight: 22,
      paddingHorizontal: 16,
    },
    postDate: {
      fontSize: 12,
      color: colors.border,
      fontFamily: "Poppins-Regular",
    },
    postFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 12,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    reactionContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    reactionText: {
      marginLeft: 4,
      marginRight: 12,
      color: colors.text,
      fontFamily: "Poppins-Regular",
      fontSize: 14,
    },
    commentIcon: {
      marginLeft: 12,
    },
    // question: {
    //   borderTopWidth: 4,
    //   borderTopColor: "#4CAF50",
    // },
    // story: {
    //   borderTopWidth: 4,
    //   borderTopColor: "#2196F3",
    // },
    // coping: {
    //   borderTopWidth: 4,
    //   borderTopColor: "#FF9800",
    // },
    // confession: {
    //   borderTopWidth: 4,
    //   borderTopColor: "#F44336",
    // },
    noPostsText: {
      textAlign: "center",
      marginTop: 16,
      color: colors.text,
      fontFamily: "Poppins-SemiBold",
      fontSize: 18,
    },
    noPostsSubtext: {
      textAlign: "center",
      marginTop: 8,
      color: colors.border,
      fontFamily: "Poppins-Regular",
    },
    moreButton: {
      color: colors.primary,
      fontFamily: "Poppins-SemiBold",
      alignSelf: "flex-start",
      marginBottom: 8,
      paddingHorizontal: 16,
    },
    createButton: {
      width: 40,
      height: 40,
      backgroundColor: colors.primary,
      borderRadius: 24,
      marginRight: 8,
      justifyContent: "center",
      alignItems: "center",
    },
  });

const typeStyles = StyleSheet.create({
  Question: { color: "#4CAF50" },
  Story: { color: "#2196F3" },
  Coping: { color: "#FF9800" },
  Confession: { color: "#F44336" },
});
