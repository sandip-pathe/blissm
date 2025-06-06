import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { Foundation, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { FIRESTORE_DB } from "@/constants/firebaseConf";
import formatDate from "@/constants/utils";
import { useTheme } from "@react-navigation/native";
import { useCustomAuth } from "@/components/authContext";

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  createdAt: Date;
  likes?: string[];
  replies?: Comment[];
  isExpanded?: boolean;
}

interface PostData {
  id: string;
  type?: string;
  title?: string;
  content?: string;
  date?: Date;
  likes?: string[];
  commentsCount?: number;
  mediaUrl?: string;
  mediaType?: string;
  userId?: string;
  userName?: string;
  userImage?: string;
}

const PostView = () => {
  const { currentUser } = useCustomAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  const [replyingToComment, setReplyingToComment] = useState<Comment | null>(
    null
  );
  const [likeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        const postRef = doc(FIRESTORE_DB, "community", id);
        const unsubscribePost = onSnapshot(postRef, (docSnap) => {
          if (docSnap.exists()) {
            const postData = docSnap.data();
            setPost({
              id: docSnap.id,
              type: postData.type || "Story",
              title: postData.title || "",
              content: postData.content || "",
              date: postData.date?.toDate() || new Date(),
              likes: postData.likes || [],
              commentsCount: postData.commentsCount || 0,
              mediaUrl: postData.mediaUrl,
              mediaType: postData.mediaType,
              userId: postData.userId,
              userName: postData.userName || "Anonymous",
              userImage: postData.userImage,
            });
          } else {
            Alert.alert("Post not found", "The requested post does not exist.");
          }
          setLoading(false);
        });

        return () => unsubscribePost();
      } catch (error) {
        console.error("Error fetching post:", error);
        Alert.alert("Error", "Failed to load post data.");
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const commentsRef = collection(FIRESTORE_DB, `community/${id}/comments`);
    const unsubscribeComments = onSnapshot(commentsRef, (snapshot) => {
      const fetchedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        userId: doc.data().userId || "",
        userName: doc.data().userName || "Anonymous",
        userImage: doc.data().userImage,
        content: doc.data().content || "",
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        likes: doc.data().likes || [],
        replies: [],
        isExpanded: false,
      })) as Comment[];
      setComments(fetchedComments);
    });

    return () => unsubscribeComments();
  }, [id]);

  const fetchReplies = async (commentId: string) => {
    try {
      const repliesRef = collection(
        FIRESTORE_DB,
        `community/${id}/comments/${commentId}/replies`
      );
      const snapshot = await getDocs(repliesRef);
      const fetchedReplies = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Comment[];

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, replies: fetchedReplies, isExpanded: true }
            : comment
        )
      );
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  const toggleCommentExpansion = (commentId: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, isExpanded: !comment.isExpanded }
          : comment
      )
    );

    const comment = comments.find((c) => c.id === commentId);
    if (comment && !comment.replies?.length) {
      fetchReplies(commentId);
    }
  };

  const handleAddReply = async (parentCommentId: string) => {
    if (!replyContent.trim() || !currentUser || !id || !parentCommentId) return;

    setIsCommenting(true);
    try {
      const repliesRef = collection(
        FIRESTORE_DB,
        `community/${id}/comments/${parentCommentId}/replies`
      );
      await addDoc(repliesRef, {
        userId: currentUser.uid,
        userName: currentUser.name || "Anonymous",
        content: replyContent,
        createdAt: serverTimestamp(),
        likes: [],
      });

      setReplyContent("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error adding reply:", error);
      Alert.alert("Error", "Failed to add reply");
    } finally {
      setIsCommenting(false);
    }
  };

  const toggleLikeComment = async (commentId: string, isReply = false) => {
    if (!id || !currentUser || !commentId) return;

    const commentRef = isReply
      ? doc(
          FIRESTORE_DB,
          `community/${id}/comments/${commentId}/replies/${commentId}`
        )
      : doc(FIRESTORE_DB, `community/${id}/comments/${commentId}`);

    try {
      await runTransaction(FIRESTORE_DB, async (transaction) => {
        const commentSnap = await transaction.get(commentRef);
        if (!commentSnap.exists()) return;

        const commentData = commentSnap.data();
        const currentLikes = commentData.likes || [];

        if (true) {
          transaction.update(commentRef, {
            likes: arrayRemove(currentUser.uid),
          });
        } else {
          transaction.update(commentRef, {
            likes: arrayUnion(currentUser.uid),
          });
        }
      });
    } catch (error) {
      console.error("Error toggling comment like:", error);
    }
  };

  const animateLike = () => {
    Animated.sequence([
      Animated.timing(likeAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(likeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleLikePost = async () => {
    if (!id || !currentUser) return;
    if (isLiking) return;

    animateLike();
    setIsLiking(true);
    const postRef = doc(FIRESTORE_DB, "community", id);

    try {
      await runTransaction(FIRESTORE_DB, async (transaction) => {
        const postSnap = await transaction.get(postRef);
        if (!postSnap.exists()) return;

        const postData = postSnap.data();
        const currentLikes = postData.likes || [];
        const isLiked = currentLikes.includes(currentUser.uid);

        transaction.update(postRef, {
          likes: isLiked
            ? arrayRemove(currentUser.uid)
            : arrayUnion(currentUser.uid),
        });
      });
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser || !id) return;

    setIsCommenting(true);
    try {
      if (replyingToComment) {
        // Handle reply
        const repliesRef = collection(
          FIRESTORE_DB,
          `community/${id}/comments/${replyingToComment.id}/replies`
        );
        await addDoc(repliesRef, {
          userId: currentUser.uid,
          userName: currentUser.name || "Anonymous",
          content: newComment,
          createdAt: serverTimestamp(),
          likes: [],
        });
      } else {
        // Handle top-level comment
        const commentsRef = collection(
          FIRESTORE_DB,
          `community/${id}/comments`
        );
        await addDoc(commentsRef, {
          userId: currentUser.uid,
          userName: currentUser.name || "Anonymous",
          content: newComment,
          createdAt: serverTimestamp(),
          likes: [],
        });

        // Update comment count only for top-level comments
        const postRef = doc(FIRESTORE_DB, "community", id);
        await runTransaction(FIRESTORE_DB, async (transaction) => {
          const postDoc = await transaction.get(postRef);
          if (postDoc.exists()) {
            transaction.update(postRef, {
              commentsCount: (postDoc.data().commentsCount || 0) + 1,
            });
          }
        });
      }

      setNewComment("");
      setReplyingToComment(null);
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const renderComment = (comment: Comment) => {
    const isCommentLiked =
      currentUser && comment.likes?.includes(currentUser.uid);
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
      <View key={comment.id} style={styles.commentContainer}>
        <View style={styles.commentHeader}>
          <View style={styles.avatarPlaceholderSmall}>
            <Ionicons name="person" size={16} color={colors.text} />
          </View>
          <Text style={styles.commentAuthor}>{comment.userName}</Text>
          <Text style={styles.commentTime}>
            {formatDate(comment.createdAt)}
          </Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>

        <View style={styles.commentActions}>
          <TouchableOpacity
            onPress={() => toggleLikeComment(comment.id)}
            style={styles.commentActionButton}
          >
            <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
              <Ionicons
                name={isCommentLiked ? "heart" : "heart-outline"}
                size={16}
                color={isCommentLiked ? "#FF5252" : colors.text}
              />
            </Animated.View>
            <Text style={styles.commentActionText}>
              {comment.likes?.length || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setReplyingToComment(comment)}
            style={styles.commentActionButton}
          >
            <MaterialIcons name="reply" size={16} color={colors.text} />
            <Text style={styles.commentActionText}>Reply</Text>
          </TouchableOpacity>
        </View>

        {hasReplies && (
          <View style={styles.repliesContainer}>
            {comment.replies.map((reply) => renderComment(reply))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Post not found. It might have been removed.
        </Text>
      </View>
    );
  }

  const {
    type,
    title,
    content,
    date,
    likes,
    mediaUrl,
    mediaType,
    commentsCount,
    userName,
  } = post;
  const hasMedia = mediaUrl && mediaType;
  const isLiked = currentUser;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        {true && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
            <Text style={styles.verifiedText}>Professional</Text>
          </View>
        )}
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={colors.text} />
            </View>
            <View>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.postDate}>{formatDate(date)}</Text>
            </View>
          </View>
          <View
            style={[styles.postTypeBadge, typeStyles[type] || typeStyles.Story]}
          >
            <Text style={styles.postTypeText}>{type}</Text>
          </View>
        </View>

        <View style={styles.postContent}>
          <Text style={styles.postTitle}>{title}</Text>
          <Text style={styles.postText}>{content}</Text>

          {hasMedia && (
            <View style={styles.mediaContainer}>
              {mediaType.startsWith("image") ? (
                <Image
                  source={{ uri: mediaUrl }}
                  style={styles.media}
                  resizeMode="cover"
                />
              ) : (
                <Foundation
                  name="video"
                  size={100}
                  color={colors.text}
                  style={{ alignSelf: "center" }}
                />
              )}
            </View>
          )}
        </View>

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={toggleLikePost}
            disabled={isLiking}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "#FF5252" : colors.text}
            />
            <Text style={styles.actionText}>{likes?.length || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="comment" size={24} color={colors.text} />
            <Text style={styles.actionText}>{commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.commentsHeader}>
          <Text style={styles.sectionTitle}>Comments ({commentsCount})</Text>
        </View>

        {comments.map(renderComment)}

        {/* Empty State */}
        {comments.length === 0 && (
          <View style={styles.emptyComments}>
            <MaterialIcons name="comment" size={48} color={colors.border} />
            <Text style={styles.emptyCommentsText}>No comments yet</Text>
            <Text style={styles.emptyCommentsSubtext}>
              Be the first to comment
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        {replyingToComment && (
          <View style={styles.replyHeader}>
            <Text style={styles.replyHeaderText}>
              Replying to {replyingToComment.userName}
            </Text>
            <TouchableOpacity
              onPress={() => setReplyingToComment(null)}
              style={styles.closeReplyButton}
            >
              <Ionicons name="close" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}
        <TextInput
          placeholder={
            replyingToComment ? "Write a reply..." : "Write a comment..."
          }
          placeholderTextColor={colors.border}
          value={newComment}
          onChangeText={setNewComment}
          style={styles.commentInput}
          multiline
        />
        <TouchableOpacity
          onPress={handleAddComment}
          disabled={!newComment.trim() || isCommenting}
          style={[
            styles.commentSubmitButton,
            (!newComment.trim() || isCommenting) && styles.disabledButton,
          ]}
        >
          {isCommenting ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Ionicons name="send" size={20} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const themedStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    errorText: {
      color: colors.notification,
      fontSize: 16,
      textAlign: "center",
    },
    postHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    avatarPlaceholderSmall: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },
    userName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    postDate: {
      fontSize: 12,
      color: colors.border,
      marginTop: 2,
    },
    postTypeBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    postTypeText: {
      fontSize: 12,
      fontWeight: "600",
      color: "white",
    },
    postContent: {
      marginBottom: 16,
    },
    postTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 12,
    },
    postText: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
      marginBottom: 16,
    },
    mediaContainer: {
      width: "100%",
      height: 250,
      borderRadius: 8,
      overflow: "hidden",
      marginBottom: 16,
    },
    media: {
      width: "100%",
      height: "100%",
    },
    postActions: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 12,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
    },
    actionText: {
      marginLeft: 8,
      color: colors.text,
      fontSize: 16,
    },
    commentsHeader: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    commentContainer: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    commentHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    commentAuthor: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginRight: 8,
    },
    commentTime: {
      fontSize: 12,
      color: colors.border,
    },
    commentText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.text,
      marginBottom: 12,
    },
    commentActions: {
      flexDirection: "row",
      marginTop: 8,
    },
    commentActionButton: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 16,
    },
    commentActionText: {
      marginLeft: 4,
      fontSize: 12,
      color: colors.text,
    },
    replyInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    replyInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      color: colors.text,
      fontSize: 14,
    },
    replyButton: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginLeft: 8,
    },
    replyButtonText: {
      color: "white",
      fontWeight: "600",
    },
    repliesContainer: {
      marginLeft: 16,
      marginTop: 12,
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
      paddingLeft: 12,
    },
    replyContainer: {
      marginBottom: 12,
    },
    viewRepliesButton: {
      marginTop: 8,
    },
    viewRepliesText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: "600",
    },
    emptyComments: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
    },
    emptyCommentsText: {
      fontSize: 16,
      color: colors.text,
      marginTop: 12,
      fontWeight: "600",
    },
    emptyCommentsSubtext: {
      fontSize: 14,
      color: colors.border,
      marginTop: 4,
    },
    commentInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      backgroundColor: colors.card,
    },
    commentInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 14,
    },
    commentSubmitButton: {
      backgroundColor: colors.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 8,
    },
    disabledButton: {
      opacity: 0.5,
    },
    replyHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 8,
    },
    replyHeaderText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: "600",
    },
    closeReplyButton: {
      padding: 4,
    },
    verifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: "auto",
      backgroundColor: "#E8F5E9",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 8,
    },
    verifiedText: {
      color: "#4CAF50",
      fontFamily: "Poppins-SemiBold",
      fontSize: 12,
      marginLeft: 4,
    },
  });

const typeStyles = StyleSheet.create({
  Question: { backgroundColor: "#4CAF50" },
  Story: { backgroundColor: "#2196F3" },
  Coping: { backgroundColor: "#FF9800" },
  Confession: { backgroundColor: "#F44336" },
});

export default PostView;
