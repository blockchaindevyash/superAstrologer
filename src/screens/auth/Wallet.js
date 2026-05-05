import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  FlatList,
  InteractionManager,
  Alert,
  Platform,
} from 'react-native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import COLORS from '../../config/colors';
import { Loader, AppStatusBar, BackButton } from '../../config/service';
import { fetchWalletData, createWalletPaymentIntent, addWallet, createWalletRazorpayOrder } from '../../api/api';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import * as RNIap from "react-native-iap";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRODUCT_IDS = [
  'astro_100_credits',
  'astro_500_credits',
  'astro_1000_credits',
];

const CREDIT_MAP = {
  astro_100_credits: 100,
  astro_500_credits: 500,
  astro_1000_credits: 1000,
};

const Wallet = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('add');
  const [amount, setAmount] = useState('');
  const [quickAmount, setQuickAmount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [stripeKey, setStripeKey] = useState(null);
  const [razorpayKey, setRazorpayKey] = useState(null);
  const [processing, setProcessing] = useState(false);

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [currency, setCurrency] = useState('₹');
  const [quickAmounts, setQuickAmounts] = useState([50, 100, 200, 500]);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [inAppAmounts, setInAppAmounts] = useState([100, 500, 1000]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load Wallet specific data (includes balance)
        const wal = await fetchWalletData();
        if (wal) {
          if (wal.balance !== undefined && wal.balance !== null) {
            setBalance(wal.balance);
          }
          setCurrency(wal.currency || '₹');
          setQuickAmounts(wal.quick_add || [50, 100, 200, 500]);
          setTransactions(wal.trans || []);
          if (wal?.keys?.stripe_key) {
            setStripeKey(wal.keys.stripe_key);
          }
          if (wal?.keys?.razorpay_key) {
            setRazorpayKey(wal.keys.razorpay_key);
          }
        }
      } catch (e) {
        console.error('Failed to load wallet data', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      connection();
      const purchaseUpdate = RNIap.purchaseUpdatedListener(async (purchase) => {
        try {
          const receipt = purchase.transactionReceipt;
          if (!receipt) return;
          const productId = purchase.productId;
          const credits = CREDIT_MAP[productId];
          // 👉 CALL YOUR BACKEND HERE
          await addCreditsToUser(credits, receipt);
          await RNIap.finishTransaction({ purchase });
          Alert.alert("Success", `${credits} credits added!`);
        } catch (error) {
          console.log("Purchase handling error", error);
        }
      });
      const purchaseError = RNIap.purchaseErrorListener((error) => {
        console.log("Purchase error", error);
        Alert.alert("Error", error.message);
      });
      return () => {
        purchaseUpdate.remove();
        purchaseError.remove();
      };
    }
  }, []);

  const connection = async () => {
    try {
      const result = await RNIap.initConnection();
      console.log('connection is => ', result);
      setTimeout(() => {
        init();
      }, 2000);
    } catch (err) {
      console.log('error in cdm => ', err);
    }
  };

  const init = async () => {
    try {
      const items = await RNIap.getProducts({ skus: PRODUCT_IDS });
      console.log("Products:", items);
      // alert(JSON.stringify(items));
      setProducts(items);
    } catch (err) {
      console.log(err);
    }
  };

  const buyProduct = async (productId) => {
    try {
      await RNIap.requestPurchase({ sku: productId });
    } catch (err) {
      console.log(err);
    }
  };

  const TransactionItem = ({ type, amount, title, date }) => (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: type === 'Credit' ? '#E8F5E9' : '#FFEBEE' }]}>
        <MaterialIcons
          name={type === 'Credit' ? 'add-card' : 'history-edu'}
          size={20}
          color={type === 'Credit' ? '#4CAF50' : COLORS.primary}
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.transactionTitle}>{title}</Text>
        <Text style={styles.transactionDate}>{date}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: type === 'Credit' ? '#4CAF50' : COLORS.primary }]}>
        {type === 'Credit' ? '+' : '-'}{amount}
      </Text>
    </View>
  );

  const handleProceed = async () => {
    try {
      if (Platform.OS === 'ios') {
        buyProduct(`astro_${amount}_credits`);
        return;
      }
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return;
      }
      setProcessing(true);
      if (paymentMethod === 'card') {
        if (!stripeKey) {
          console.warn('Stripe key not available');
          return;
        }
        const intent = await createWalletPaymentIntent(Number(amount));
        const clientSecret = intent?.paymentIntentClientSecret || intent?.clientSecret || intent?.secret;
        if (!clientSecret) {
          throw new Error('Payment Intent client secret missing');
        }
        const initRes = await initPaymentSheet({
          merchantDisplayName: 'Astro',
          paymentIntentClientSecret: clientSecret,
          allowsDelayedPaymentMethods: false,
        });
        if (initRes.error) {
          throw new Error(initRes.error.message);
        }
        await new Promise((resolve) => InteractionManager.runAfterInteractions(resolve));
        const presentRes = await presentPaymentSheet();
        if (presentRes.error) {
          throw new Error(presentRes.error.message);
        }
        const addRes = await addWallet(Number(amount), 'card');
        if (addRes?.data) {
          setTransactions(addRes.data.data);
          setBalance(String(addRes.data.balance));
          Alert.alert('Success!', `${currency}${amount} has been added to your wallet successfully.`, [{ text: 'OK' }]);
          setAmount('');
          setQuickAmount(null);
        }
      } else {
        // For now, ignore other methods
        return;
      }
    } catch (e) {
      console.error('Payment error:', e);
    } finally {
      setProcessing(false);
    }
  };

  // const handleProceed = async () => {
  //   try {
  //     if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
  //       return;
  //     }
  //     setProcessing(true);
  //     if (paymentMethod === 'card') {
  //       if (!stripeKey) {
  //         console.warn('Stripe key not available');
  //         return;
  //       }
  //       const intent = await createWalletPaymentIntent(Number(amount));
  //       const clientSecret = intent?.paymentIntentClientSecret || intent?.clientSecret || intent?.secret;
  //       if (!clientSecret) {
  //         throw new Error('Payment Intent client secret missing');
  //       }
  //       const initRes = await initPaymentSheet({
  //         merchantDisplayName: 'Astro',
  //         paymentIntentClientSecret: clientSecret,
  //         allowsDelayedPaymentMethods: false,
  //       });
  //       if (initRes.error) {
  //         throw new Error(initRes.error.message);
  //       }
  //       await new Promise((resolve) => InteractionManager.runAfterInteractions(resolve));
  //       const presentRes = await presentPaymentSheet();
  //       if (presentRes.error) {
  //         throw new Error(presentRes.error.message);
  //       }
  //       const addRes = await addWallet(Number(amount), 'card');
  //       if (addRes?.data) {
  //         setTransactions(addRes.data.data);
  //         setBalance(String(addRes.data.balance));
  //         Alert.alert('Success!', `${currency}${amount} has been added to your wallet successfully.`, [{ text: 'OK' }]);
  //         setAmount('');
  //         setQuickAmount(null);
  //       }
  //     } else if (paymentMethod === 'upi') {

  //       console.log("dd");

  //       if (!razorpayKey) {
  //         console.warn('Razorpay key not available');
  //         return;
  //       }
  //       const order = await createWalletRazorpayOrder(Number(amount));
  //       const orderId = order?.orderId || order?.id || order?.data?.orderId || order?.data?.id;
  //       const amountPaise = order?.amount || Math.round(Number(amount) * 100);
  //       const curr = order?.currency || 'INR';

  //       const options = {
  //         key: razorpayKey,
  //         amount: amountPaise,
  //         currency: curr,
  //         name: 'Astro',
  //         description: 'Wallet Recharge',
  //         order_id: orderId,
  //         theme: { color: COLORS.primary },
  //       };

  //       await RazorpayCheckout.open(options);

  //       const addRes = await addWallet(Number(amount), 'razorpay');
  //       if (addRes?.data) {
  //         setTransactions(addRes.data.data);
  //         setBalance(String(addRes.data.balance));
  //         Alert.alert('Success!', `${currency}${amount} has been added to your wallet successfully.`, [{ text: 'OK' }]);
  //         setAmount('');
  //         setQuickAmount(null);
  //       }
  //     } else {
  //       // For now, ignore other methods
  //       return;
  //     }
  //   } catch (e) {
  //     console.error('Payment error:', e);
  //   } finally {
  //     setProcessing(false);
  //   }
  // };

  return (
    <StripeProvider publishableKey={stripeKey || ''}>
      <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
        <AppStatusBar backgroundColor={COLORS.secondary} />
        {/* Header */}
        <View style={styles.header}>
          <BackButton navigation={navigation} />
          <Text style={styles.headerTitle}>My Wallet</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceValue}>{currency}{balance}</Text>
            </View>
            <View style={styles.balanceIconBg}>
              <MaterialIcons name="account-balance-wallet" size={32} color="#fff" />
            </View>
          </View>
          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'add' && styles.activeTab]}
              onPress={() => setActiveTab('add')}>
              <Text style={[styles.tabText, activeTab === 'add' && styles.activeTabText]}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'history' && styles.activeTab]}
              onPress={() => setActiveTab('history')}>
              <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
            </TouchableOpacity>
          </View>
          {activeTab === 'add' ? (
            <View style={styles.content}>
              <View style={styles.card}>
                {Platform.OS === 'ios' ? (
                  <View style={styles.quickAmountGrid}>
                  {inAppAmounts.map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[styles.quickAmountBtn, quickAmount === val && styles.quickAmountBtnActive]}
                      onPress={() => {
                        setQuickAmount(val);
                        setAmount(String(val));
                      }}>
                      <Text style={[styles.quickAmountText, quickAmount === val && styles.quickAmountTextActive]}>
                        {currency}{val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  </View>
                ) : (
                <>
                <Text style={styles.cardLabel}>Enter Amount ({currency}) & min {currency}40</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputPrefix}>{currency}</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.quickAmountGrid}>
                  {quickAmounts.map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[styles.quickAmountBtn, quickAmount === val && styles.quickAmountBtnActive]}
                      onPress={() => {
                        setQuickAmount(val);
                        setAmount(String(val));
                      }}>
                      <Text style={[styles.quickAmountText, quickAmount === val && styles.quickAmountTextActive]}>
                        {currency}{val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
               </>
               )}
                {/* <Text style={[styles.cardLabel, { marginTop: 24 }]}>Select Payment Method</Text>
              <TouchableOpacity 
                style={[styles.paymentOption, paymentMethod === 'upi' && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod('upi')}
              >
                <View style={styles.paymentIconBg}>
                  <MaterialIcons name="account-balance" size={22} color={paymentMethod === 'upi' ? COLORS.primary : '#64748B'} />
                </View>
                <Text style={[styles.paymentOptionText, paymentMethod === 'upi' && styles.paymentOptionTextActive]}>UPI (PhonePe, Google Pay, etc.)</Text>
                <MaterialIcons 
                  name={paymentMethod === 'upi' ? "radio-button-checked" : "radio-button-unchecked"} 
                  size={20} 
                  color={paymentMethod === 'upi' ? COLORS.primary : '#CBD5E1'} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod('card')}
              >
                <View style={styles.paymentIconBg}>
                  <MaterialIcons name="credit-card" size={22} color={paymentMethod === 'card' ? COLORS.primary : '#64748B'} />
                </View>
                <Text style={[styles.paymentOptionText, paymentMethod === 'card' && styles.paymentOptionTextActive]}>Debit / Credit Card</Text>
                <MaterialIcons 
                  name={paymentMethod === 'card' ? "radio-button-checked" : "radio-button-unchecked"} 
                  size={20} 
                  color={paymentMethod === 'card' ? COLORS.primary : '#CBD5E1'} 
                />
              </TouchableOpacity> */}
                <TouchableOpacity
                  style={styles.addBtn}
                  activeOpacity={0.8}
                  onPress={handleProceed}
                  disabled={
                    processing ||
                    ((paymentMethod === 'card') && !stripeKey) ||
                    ((paymentMethod === 'upi' || paymentMethod === 'razorpay') && !razorpayKey) ||
                    !amount || isNaN(Number(amount)) || Number(amount) <= 0
                  }>
                  <Text style={styles.addBtnText}>Proceed to Recharge</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.infoCard}>
                <MaterialIcons name="info-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  Wallet balance can be used for chat and call sessions with all astrologers.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Recent Transactions</Text>
                {transactions.length > 0 ? transactions.map((item) => (
                  <TransactionItem
                    key={item.id}
                    type={item.type}
                    title={item.notes}
                    date={item.date}
                    amount={item.amount}
                  />
                )) : (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Text style={{ color: '#94A3B8' }}>No transactions found</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
        {(loading || processing) && <Loader fullScreen={true} />}
      </SafeAreaView>
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.secondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  scroll: {
    paddingBottom: 30,
  },
  balanceCard: {
    margin: 20,
    padding: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  balanceIconBg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 6,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: `${COLORS.primary}10`,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  content: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputPrefix: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    paddingVertical: 12,
  },
  quickAmountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  quickAmountBtn: {
    flex: 1,
    minWidth: '20%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  quickAmountBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}05`,
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  quickAmountTextActive: {
    color: COLORS.primary,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  paymentOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}05`,
  },
  paymentIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  paymentOptionTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}05`,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  transactionDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
});

export default Wallet;
