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
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { FIRESTORE_DB } from "@/constants/firebaseConf";
import formatDate from "@/constants/utils";

const PostCard = ({
  item,
  colors,
  router,
  expandedPosts,
  toggleExpand,
  handleLike,
  userLocation,
}) => {
  const styles = themedStyles(colors);
  const hasMedia = item.mediaUrl && item.mediaType;
  const [isLiked, setIsLiked] = useState(false);
  const [likeScale] = useState(new Animated.Value(1));
  const distance =
    userLocation && item.location
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          item.location.latitude,
          item.location.longitude
        )
      : null;

  const animateLike = () => {
    Animated.sequence([
      Animated.timing(likeScale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(likeScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onLikePress = () => {
    animateLike();
    setIsLiked(!isLiked);
    handleLike(item.id, isLiked ? -1 : 1);
  };

  return (
    <View style={[styles.postCard]}>
      <Text style={[styles.postType, typeStyles[item.type]]}>{item.type}</Text>
      <View style={styles.postHeader}>
        <View style={styles.authorContainer}>
          <View style={styles.authorAvatar}>
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={colors.text}
            />
          </View>
          <View>
            <Text style={styles.username}>
              {item.author?.username || "Anonymous"}
            </Text>
          </View>
        </View>
        <Text style={styles.postDate}>
          {formatDate(item.date) || "Unknown Date"}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => router.navigate(`../(community)/${item.id}`)}
        activeOpacity={0.8}
      >
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
              <VideoView
                style={styles.media}
                player={useVideoPlayer(item.mediaUrl, (player) => {
                  player.loop = true;
                  player.play();
                })}
                allowsFullscreen
                allowsPictureInPicture
              />
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
      </TouchableOpacity>

      <View style={styles.postFooter}>
        <TouchableOpacity
          style={styles.reactionButton}
          onPress={onLikePress}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={20}
              color={isLiked ? "#ff4d4d" : colors.text}
            />
          </Animated.View>
          <Text style={[styles.reactionText, isLiked && styles.likedText]}>
            {item.likes || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reactionButton}
          onPress={() => router.navigate(`../(community)/${item.id}`)}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.text} />
          <Text style={styles.reactionText}>{item.comments?.length || 0}</Text>
        </TouchableOpacity>

        {item.role == "professional" && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
            <Text style={styles.verifiedText}>Professional</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const CommunityScreen: React.FC = () => {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
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

  const handleLike = async (postId, increment) => {
    try {
      const postRef = doc(FIRESTORE_DB, "community", postId);
      await updateDoc(postRef, {
        likes: increment + posts.find((p) => p.id === postId)?.likes || 0,
      });

      setPosts(
        posts.map((post) =>
          post.id === postId
            ? { ...post, likes: (post.likes || 0) + increment }
            : post
        )
      );
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesTab = activeTab === "All" || post.type === activeTab;
    const matchesQuery =
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatDate(post.date).toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author?.username?.toLowerCase().includes(searchQuery.toLowerCase());
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
        <Text style={styles.loadingText}>Finding supportive community...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search topics, posts..."
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

      <View>
        {userLocation && (
          <Text style={styles.locationHeader}>
            <Ionicons name="location" size={14} /> Near you
          </Text>
        )}
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
            handleLike={handleLike}
            userLocation={userLocation}
          />
        )}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.feedContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.border} />
            <Text style={styles.noPostsText}>No posts found</Text>
            <Text style={styles.noPostsSubtext}>
              {searchQuery
                ? "Try a different search"
                : "Share your thoughts with the community"}
            </Text>
            <TouchableOpacity
              style={styles.createPostButton}
              onPress={() => router.navigate("../(community)/new")}
            >
              <Text style={styles.createPostButtonText}>Create First Post</Text>
            </TouchableOpacity>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

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
      marginHorizontal: 16,
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
      paddingVertical: 24,
      paddingHorizontal: 16,
    },
    postHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginVertical: 8,
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
      color: colors.text,
      fontFamily: "Poppins-Regular",
      lineHeight: 22,
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
    loadingText: {
      marginTop: 16,
      color: colors.text,
      fontFamily: "Poppins-Regular",
    },
    locationHeader: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: "Poppins-Regular",
      marginTop: 4,
    },
    searchIcon: {
      marginRight: 8,
    },
    authorContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    authorAvatar: {
      marginRight: 8,
    },
    username: {
      color: colors.text,
      fontFamily: "Poppins-Regular",
      fontSize: 14,
    },
    therapistBadge: {
      color: "#4CAF50",
      fontFamily: "Poppins-Bold",
      fontSize: 12,
    },
    locationText: {
      color: colors.border,
      fontFamily: "Poppins-Regular",
      fontSize: 10,
    },
    reactionButton: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 20,
    },
    likedText: {
      color: "#ff4d4d",
    },
    verifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: "auto",
      backgroundColor: "#E8F5E9",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    verifiedText: {
      color: "#4CAF50",
      fontFamily: "Poppins-SemiBold",
      fontSize: 12,
      marginLeft: 4,
    },
    createPostButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      marginTop: 24,
    },
    createPostButtonText: {
      color: "#fff",
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
    },
    separator: {
      height: 8,
    },
  });

const typeStyles = StyleSheet.create({
  Question: { color: "#4CAF50" },
  Story: { color: "#2196F3" },
  Coping: { color: "#FF9800" },
  Confession: { color: "#F44336" },
});
