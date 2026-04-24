import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";

import { getPush } from "../../api/api";
import COLORS from "../../config/colors";
import { Loader, AppStatusBar, BackButton } from "../../config/service";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Push = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await getPush();
      setNotifications(res?.data?.data ?? []);
    } catch (error) {
      console.log("Push fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Full Width Image */}
      {item.img ? (
        <Image source={{ uri: item.img }} style={styles.bannerImage} />
      ) : null}
      <View style={styles.contentRow}>
        {!item.img && (
          <View style={styles.iconBox}>
            <MaterialIcons
              name="notifications"
              size={22}
              color={COLORS.primary}
            />
          </View>
        )}
        <View style={styles.textBox}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.text}</Text>
          <Text style={styles.time}>{item.date}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
      <AppStatusBar backgroundColor={COLORS.secondary} />
      {/* Header */}
      <View style={styles.header}>
        <BackButton navigation={navigation} />
        <Text style={styles.headerTitle}>Alerts & Notifications</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading ? (
        <Loader />
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons
            name="notifications-off"
            size={42}
            color="#aaa"
          />
          <Text style={styles.emptyText}>
            No notifications available
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

export default Push;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 2,
    marginTop:20
  },

  bannerImage: {
    width: "100%",
    height: 120,
  },

  contentRow: {
    flexDirection: "row",
    padding: 14,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#F1EBFA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  textBox: {
    flex: 1,
  },

  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },

  description: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
  },

  time: {
    fontSize: 11,
    color: "#999",
    marginTop: 6,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    marginTop: 8,
    color: "#888",
    fontSize: 14,
  },
});

