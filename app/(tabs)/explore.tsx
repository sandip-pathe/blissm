import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import Colors from "@/constants/Colors";
import {
  AntDesign,
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { TextInput } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { FIRESTORE_DB } from "@/FirebaseConfig";
import { getAllChatSessions, inspectDatabase } from "@/database/sqlite";
import Avatar from "@/components/Avatar";
import { RefreshControl } from "react-native";
import * as Network from "expo-network";

interface onlineGPTs {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
}

interface localGPTs {
  id: string;
  title: string;
  icon?: string;
  image?: string;
  created_at: any;
  is_pinned: boolean;
}

const ChatDashboardScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState("list");
  const [gptModels, setGptModels] = useState<onlineGPTs[]>([]);
  const [localChats, setLocalChats] = useState<localGPTs[]>([]);
  const router = useRouter();
  const db = useSQLiteContext();
  const [filteredOnlineEntries, setFilteredOnlineEntries] = useState<any[]>([]);
  const [filteredLocalEntries, setFilteredLocalEntries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingOnline, setLoadingOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkNetworkStatus = async () => {
      const status = await Network.getNetworkStateAsync();
      setIsConnected(status.isInternetReachable ?? null);
    };

    checkNetworkStatus();
    const interval = setInterval(checkNetworkStatus, 5000);
    console.log("Checking network status every 5 seconds");
    console.log("Network status: ", isConnected);
    return () => clearInterval(interval);
  }, []);

  const fetchLocalModels = async () => {
    try {
      const chatSessions: localGPTs[] = await getAllChatSessions(db);
      setLocalChats(chatSessions);
    } catch (error) {
      console.error("Failed to load local chat sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchLocalModels();
  }, []);

  const fetchOnlineModels = async () => {
    try {
      const querySnapshot = await getDocs(collection(FIRESTORE_DB, "personas"));
      const models: onlineGPTs[] = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        icon: doc.data().icon,
        image: doc.data().image,
      }));
      setGptModels(models);
    } catch (error) {
      console.error("Error fetching GPT models: ", error);
    } finally {
      setLoadingOnline(false);
    }
  };

  useEffect(() => {
    setLoadingOnline(true);
    fetchOnlineModels();
  }, []);

  useEffect(() => {
    const filteredOnline = gptModels.filter(
      (entry) =>
        (entry.title &&
          entry.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (entry.description &&
          entry.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredOnlineEntries(filteredOnline);

    const filteredLocal = localChats.filter(
      (entry) =>
        (entry.title &&
          entry.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (entry.created_at &&
          entry.created_at.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredLocalEntries(filteredLocal);
  }, [searchQuery, gptModels, localChats]);

  const highlightSearchTerm = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <Text key={index} style={styles.highlight}>
          {part}
        </Text>
      ) : (
        part
      )
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchLocalModels(), fetchOnlineModels()]);
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.journalList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search names, dates . . ."
              placeholderTextColor={Colors.light}
              style={styles.searchInput}
              value={searchQuery}
              cursorColor={Colors.light}
              onChangeText={setSearchQuery}
            />
            <MaterialCommunityIcons
              onPress={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              name={viewMode === "list" ? "view-grid" : "view-agenda"}
              color="white"
              size={24}
            />
            <TouchableOpacity
              onPress={() => router.navigate("/(modals)/settings")}
            >
              <Ionicons name="settings" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View>
            {isConnected === null ? (
              <ActivityIndicator size="large" color="blue" />
            ) : !isConnected ? (
              <>
                <Text>No Internet.</Text>
                <Text>Check your connection or use offline mode.</Text>
              </>
            ) : (
              <Text>You are online!</Text>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.accent} />
          ) : filteredLocalEntries.length > 0 ? (
            <>
              {filteredLocalEntries.length > 0 && (
                <>
                  {viewMode === "list" ? (
                    filteredLocalEntries.map((e) => (
                      <TouchableOpacity
                        key={e.id}
                        style={styles.journalItem}
                        onPress={() => router.navigate(`../(chat)/${e.id}`)}
                      >
                        <View style={styles.iconContainer}>
                          <Avatar
                            title={e.title}
                            imageUrl={e.imageUrl}
                            size={50}
                          />
                        </View>
                        <View style={styles.detailsContainer}>
                          <Text style={styles.roleText}>
                            {highlightSearchTerm(e.title)}
                          </Text>
                          <Text style={styles.descriptionText}>
                            {e.created_at}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.gridContainer}>
                      <View style={styles.column}>
                        {filteredLocalEntries
                          .filter((_, index) => index % 2 === 0)
                          .map((e) => (
                            <TouchableOpacity
                              key={e.id}
                              style={styles.gridItem}
                              onPress={() =>
                                router.navigate(`../(chat)/${e.id}`)
                              }
                            >
                              <View style={styles.iconContainer}>
                                <Avatar
                                  title={e.title}
                                  imageUrl={e.imageUrl}
                                  size={70}
                                />
                              </View>
                              <View style={styles.detailsContainer}>
                                <Text style={styles.roleText}>{e.title}</Text>
                                <Text style={styles.descriptionText}>
                                  {e.created_at}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                      </View>
                      <View style={styles.column}>
                        {filteredLocalEntries
                          .filter((_, index) => index % 2 !== 0)
                          .map((e) => (
                            <TouchableOpacity
                              key={e.id}
                              style={styles.gridItem}
                              onPress={() =>
                                router.navigate(`../(chat)/${e.id}`)
                              }
                            >
                              <View style={styles.iconContainer}>
                                <Avatar
                                  title={e.title}
                                  imageUrl={e.imageUrl}
                                  size={70}
                                />
                              </View>
                              <View style={styles.detailsContainer}>
                                <Text style={styles.roleText}>{e.title}</Text>
                                <Text style={styles.descriptionText}>
                                  {e.created_at}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </>
          ) : (
            <Text style={styles.notFoundText}>
              No chat found try exploring models to get started
            </Text>
          )}

          {loadingOnline ? (
            <ActivityIndicator size="large" color={Colors.accent} />
          ) : (
            <>
              {filteredOnlineEntries.length > 0 && (
                <>
                  <Text style={styles.title}>Explore More</Text>
                  {viewMode === "list" ? (
                    filteredOnlineEntries.map((e) => (
                      <TouchableOpacity
                        key={e.id}
                        style={styles.journalItem}
                        onPress={() => router.navigate(`../(chat)/${e.id}`)}
                      >
                        <View style={styles.iconContainer}>
                          <Avatar
                            title={e.title}
                            imageUrl={e.imageUrl}
                            size={50}
                          />
                        </View>
                        <View style={styles.detailsContainer}>
                          <Text style={styles.roleText}>
                            {highlightSearchTerm(e.title)}
                          </Text>
                          <Text style={styles.descriptionText}>
                            {e.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.gridContainer}>
                      <View style={styles.column}>
                        {filteredOnlineEntries
                          .filter((_, index) => index % 2 === 0)
                          .map((e) => (
                            <TouchableOpacity
                              key={e.id}
                              style={styles.gridItem}
                              onPress={() =>
                                router.navigate(`../(chat)/${e.id}`)
                              }
                            >
                              <View style={styles.iconContainer}>
                                <Avatar
                                  title={e.title}
                                  imageUrl={e.imageUrl}
                                  size={70}
                                />
                              </View>
                              <View style={styles.detailsContainer}>
                                <Text style={styles.roleText}>{e.title}</Text>
                                <Text style={styles.descriptionText}>
                                  {e.description}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                      </View>
                      <View style={styles.column}>
                        {filteredOnlineEntries
                          .filter((_, index) => index % 2 !== 0)
                          .map((e) => (
                            <TouchableOpacity
                              key={e.id}
                              style={styles.gridItem}
                              onPress={() =>
                                router.navigate(`../(chat)/${e.id}`)
                              }
                            >
                              <View style={styles.iconContainer}>
                                <Avatar
                                  title={e.title}
                                  imageUrl={e.imageUrl}
                                  size={70}
                                />
                              </View>
                              <View style={styles.detailsContainer}>
                                <Text style={styles.roleText}>{e.title}</Text>
                                <Text style={styles.descriptionText}>
                                  {e.description}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  journalList: {
    marginBottom: 20,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light,
    marginVertical: 10,
    fontFamily: "Poppins-Regular",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchContainer: {
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent2,
    borderRadius: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    color: Colors.greyLight,
    paddingVertical: 10,
    fontFamily: "Poppins-Regular",
  },
  journalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  column: {
    flex: 1,
    flexDirection: "column",
  },
  gridItem: {
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.primary,
    marginVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
    gap: 10,
  },
  iconContainer: {
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
  },
  roleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.greyLight,
    fontFamily: "Poppins-Regular",
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.light,
    marginVertical: 20,
    fontFamily: "Poppins-Regular",
  },
  highlight: {
    fontWeight: "bold",
    backgroundColor: Colors.dark,
    fontFamily: "Poppins-Regular",
  },
});

export default ChatDashboardScreen;
