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
  const [viewMode, setViewMode] = useState("grid");
  const [gptModels, setGptModels] = useState<onlineGPTs[]>([]);
  const [localChats, setLocalChats] = useState<localGPTs[]>([]);
  const router = useRouter();
  const db = useSQLiteContext();
  const [filteredOnlineEntries, setFilteredOnlineEntries] = useState<any[]>([]); // Separate filtered entries for online GPTs
  const [filteredLocalEntries, setFilteredLocalEntries] = useState<any[]>([]); // Separate filtered entries for local chats
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingOnline, setLoadingOnline] = useState(true);

  useEffect(() => {
    setLoading(true);
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
    fetchLocalModels();
  }, []);

  useEffect(() => {
    setLoadingOnline(true);
    const fetchOnlineModels = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(FIRESTORE_DB, "personas")
        );
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

  return (
    <>
      <ScrollView contentContainerStyle={styles.journalList}>
        <View style={styles.container}>
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search names, dates . . ."
              placeholderTextColor={Colors.light}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <MaterialCommunityIcons
              onPress={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              name={viewMode === "list" ? "view-grid" : "view-agenda"}
              color={Colors.light}
              size={24}
            />
            <TouchableOpacity
              onPress={() => router.navigate("/(modals)/settings")}
            >
              <Ionicons name="settings" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : filteredLocalEntries.length === 0 ? (
            <Text style={styles.notFoundText}>
              No chat found try exploring models to get started
            </Text>
          ) : (
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
                          <Ionicons
                            name="chatbox"
                            size={40}
                            color={Colors.light}
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
                                <Ionicons
                                  name="chatbox"
                                  size={50}
                                  color={Colors.light}
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
                                <Ionicons
                                  name="chatbox"
                                  size={50}
                                  color={Colors.light}
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
          )}

          {loadingOnline ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : filteredLocalEntries.length === 0 ? (
            <>
              <Text style={styles.notFoundText}>No Internet.</Text>
              <Text style={styles.notFoundText}>
                Check your internet connection or see your local chats.
              </Text>
            </>
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
                          <Ionicons
                            name={e.icon as any}
                            size={40}
                            color={Colors.light}
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
                                <Ionicons
                                  name={e.icon as any}
                                  size={50}
                                  color={Colors.light}
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
                                <Ionicons
                                  name={e.icon as any}
                                  size={50}
                                  color={Colors.light}
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
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchContainer: {
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.darkLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    color: Colors.light,
    paddingVertical: 10,
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
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.light,
    marginVertical: 20,
  },
  highlight: {
    fontWeight: "bold",
    backgroundColor: Colors.dark,
  },
});

export default ChatDashboardScreen;
