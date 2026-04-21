import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { fetchWelcomeData } from '../../api/api';
import COLORS from '../../config/colors';
import {Loader,AppStatusBar} from '../../config/service';

export default function Welcome({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWelcomeData();
  }, []);

  const loadWelcomeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchWelcomeData();
      setData(result);
    } catch (err) {
      console.error('Error fetching welcome data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <Loader/>
      </View>
    );
  }

  return (

    <ScrollView contentContainerStyle={styles.container}>
     <AppStatusBar backgroundColor="#fff" barStyle="light-content"/>
      
      {/* Top Image */}
      <View style={styles.topImageWrapper}>
      <Image
      source={require('../../../assets/welcome.jpg')}
      style={styles.topImage}
      />
      </View>

      {/* Card Container */}
      <View style={styles.card}>

        {/* Logo */}
        <View style={styles.iconWrapper}>
        <Image
      source={require('../../../assets/logo.png')}
      style={styles.logo}
      />
        </View>

        {/* Title */}
        <Text style={styles.title}>{data?.data?.title}</Text>
        <Text style={styles.subtitle}>{data?.data?.desc}</Text>

        {/* Buttons */}
        <TouchableOpacity
          style={styles.signupBtn}
          onPress={() => navigation.navigate("Login", {
            country: data?.data?.country,
            privacy: data?.data?.privacy,
            terms: data?.data?.terms
          })}
        >
          <Text style={styles.signupText}>Get Started</Text>
        </TouchableOpacity>

        

       

      </View>
    </ScrollView>
  );
}

const PRIMARY = COLORS.primary;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center', 
    flex: 1,
    backgroundColor:"#fff"
  },

  topImageWrapper: {
  alignItems: "center", 
  flex:1,
  padding:25
},

topImage: {
  width: "100%", 
  height: 360,  
  aspectRatio: 1.5,   
  resizeMode: "contain",
  marginTop:40
},

logo:
{
  width:"100%",
  aspectRatio: 1.5,
  height:150,
  resizeMode: "contain",   
},

  card: {
  padding: 25,
  width: "100%",                 // slightly narrower to show rounded edges
  alignSelf: "center",          // center horizontally
  borderTopLeftRadius: 30,      // rounded top-left
  borderTopRightRadius: 30,     // rounded top-right
  borderBottomLeftRadius: 0,    // optional, keep bottom corners square
  borderBottomRightRadius: 0,
  shadowColor: "#00000",          // shadow for iOS
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
},

  iconWrapper: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 15,
  },

  iconText: {
    fontSize: 30,
    color: "#fff",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
    color: "#000",
  },

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#555",
    marginBottom: 20,
  },

  signupBtn: {
    backgroundColor: PRIMARY,
    padding: 14,
    borderRadius: 10,
    marginBottom: 25,
    marginTop:20,

  },
  signupText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  

  orText: {
    textAlign: "center",
    marginTop: 20,
    color: "#777",
  },

});
