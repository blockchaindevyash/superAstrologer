import React from 'react'
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { fetchAstrologerData } from '../../api/api'

const avatarImg = require('../../../assets/catee.jpg')

const Profile = ({ route }) => {

  const { astrologer } = route?.params || {}

  console.log(astrologer);

  const data = astrologer || { 
    name: 'Astrologer', 
    desc: 'No description available', 
    language: '', 
    type: '', 
    cates: [],
    img: null 
  }

  const [tab, setTab] = React.useState('about')
  const [categoryNames, setCategoryNames] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  // Fetch category names from API
  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await fetchAstrologerData()
        const allCategories = result.data?.cates || []
        
        // Filter categories that match the astrologer's cates array
        if (data.cates && data.cates.length > 0) {
          const matchedCategories = allCategories.filter(cat => 
            data.cates.includes(cat.id)
          )
          setCategoryNames(matchedCategories.map(cat => cat.name))
        }
      } catch (error) {
        console.error('Error loading categories:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadCategories()
  }, [data.cates])

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerWrap}>
          <Image source={data.img ? { uri: data.img } : avatarImg} style={styles.avatar} />
          <Text style={styles.name}>{data.name}</Text>
          {data.type ? (
            <View style={styles.typeButton}>
              <Text style={styles.typeButtonText}>{data.type}</Text>
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>1020</Text>
              <Text style={styles.statLabel}>orders</Text>
            </View>
            <View style={[styles.statItem, { alignItems: 'center' }]}>
              <Text style={styles.statValue}>4.5</Text>
              <Text style={styles.statLabel}>rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{categoryNames.length || data.cates?.length || 0}</Text>
              <Text style={styles.statLabel}>categories</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity onPress={() => setTab('about')} style={[styles.tabBtn, tab === 'about' ? styles.tabActive : null]}>
            <Text style={[styles.tabText, tab === 'about' ? styles.tabTextActive : null]}>About</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('languages')} style={[styles.tabBtn, tab === 'languages' ? styles.tabActive : null]}>
            <Text style={[styles.tabText, tab === 'languages' ? styles.tabTextActive : null]}>Languages</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('categories')} style={[styles.tabBtn, tab === 'categories' ? styles.tabActive : null]}>
            <Text style={[styles.tabText, tab === 'categories' ? styles.tabTextActive : null]}>Categories</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {tab === 'about' ? (
            <View>
              {data.desc ? <Text style={styles.desc}>{data.desc}</Text> : <Text style={styles.desc}>No details available.</Text>}
            </View>
          ) : tab === 'languages' ? (
            <View>
              {data.language ? (
                data.language.split(',').map((lang, idx) => (
                  <View key={idx} style={styles.exCard}>
                    <Text style={styles.exName}>{lang.trim()}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.desc}>No languages listed.</Text>
              )}
            </View>
          ) : (
            <View>
              {loading ? (
                <ActivityIndicator size="small" color="#ff5722" />
              ) : categoryNames.length > 0 ? (
                categoryNames.map((catName, idx) => (
                  <View key={idx} style={styles.exCard}>
                    <Text style={styles.exName}>{catName}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.desc}>No categories listed.</Text>
              )}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

function formatNumber(n) {
  if (n == null) return '0'
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 18, paddingBottom: 40,marginTop:30 },
  headerWrap: { alignItems: 'center', marginBottom: 18 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: '#111' },
  title: { color: '#666', marginTop: 4, marginBottom: 20 },
  typeButton: {
    backgroundColor: '#fff7d9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  typeButtonText: {
    color: '#ff5722',
    fontWeight: '600',
    fontSize: 14,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 30, marginTop: 10 },
  statItem: { alignItems: 'flex-start' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#111' },
  statLabel: { color: '#777', fontSize: 12 },
  tabBar: { flexDirection: 'row', marginTop: 18, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabBtn: { paddingVertical: 10, paddingHorizontal: 12, marginRight: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#ff5722' },
  tabText: { color: '#666', fontWeight: '600' },
  tabTextActive: { color: '#ff5722' },
  tabContent: { marginTop: 14 },
  desc: { color: '#333', lineHeight: 20 },
  exCard: { padding: 12, borderRadius: 12, backgroundColor: '#fff7d9', marginBottom: 10 },
  exName: { fontWeight: '700', marginBottom: 6 },
  exDetail: { color: '#444' },
})

export default Profile