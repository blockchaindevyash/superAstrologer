import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  TouchableOpacity,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";

import { getAiHistory, getAiHistoryDetail, getPush } from "../../api/api";
import COLORS from "../../config/colors";
import { Loader, AppStatusBar, BackButton } from "../../config/service";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import kundali from "../../../assets/kundali.jpg";
import pre from "../../../assets/pre.jpg";
import horo from "../../../assets/horo.jpg";
import mm from "../../../assets/mm.jpg";
import b from "../../../assets/b.jpg";

const AiHistory = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await getAiHistory();
      setAiHistory(res?.data?.data ?? []);
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

  const fmtTimeString = (ts) => {
    if (!ts) return '';

    const d = new Date(ts);
    const now = new Date();

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isToday) {
      let hrs = d.getHours();
      const mins = d.getMinutes();
      const ampm = hrs >= 12 ? 'PM' : 'AM';

      hrs = hrs % 12;
      if (hrs === 0) hrs = 12;

      return `${hrs}:${mins < 10 ? '0' + mins : mins} ${ampm}`;
    }

    if (isYesterday) {
      return "Yesterday";
    }

    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const onGetAiDetailData = async (item) => {
    try {
      const detailResponse = await getAiHistoryDetail(item.id);

      if (detailResponse.data?.status) {
        let detailData= detailResponse.data?.data;
        const formData = {
          name: detailData?.name,
          dob: detailData?.dob ? detailData?.dob : '',
          tob: detailData?.tob ? detailData?.tob : '',
          pob: detailData?.pob,
          gender: detailData?.gender,
          language: detailData?.language,
        };
        navigation.navigate('AiHistoryDetails', {kundaliData: detailResponse.data?.data, personalDetails: formData});
      }
    } catch (error) {
      console.log("Error fetching AI history detail:", error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => onGetAiDetailData(item)}>
      <Image source={item.type === "kundali" ? kundali : item.type === "prediction" ? pre : item.type === "horoscope" ? horo : item.type === "baby" ? b : mm} style={styles.bannerImage}/>
      <View style={styles.contentRow}>
        <View style={styles.textBox}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.description}>{item.type}</Text>
          <Text style={styles.time}>{fmtTimeString(item.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
      <AppStatusBar backgroundColor={COLORS.secondary} />
      {/* Header */}
      <View style={styles.header}>
        <BackButton navigation={navigation} />
        <Text style={styles.headerTitle}>AI History</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading ? (
        <Loader />
      ) : aiHistory.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons
            name="notifications-off"
            size={42}
            color="#aaa"
          />
          <Text style={styles.emptyText}>
            No AI History available
          </Text>
        </View>
      ) : (
        <FlatList
          data={aiHistory}
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
          contentContainerStyle={{paddingBottom: 20}}
        />
      )}
    </View>
  );
};

export default AiHistory;

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