import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

//URL should be like this https://www.abc.com/api/
const API_BASE_URL = 'https://astro.iraglobaltech.com/api/';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 70000, // Increased timeout to 30 seconds for kundali generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token from local storage to every request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const path = (config.url || '').replace(/^\//, '');
      const noAuthEndpoints = new Set(['welcome', 'login', 'resendCode', 'verifyCode']);
      const requiresAuth = !noAuthEndpoints.has(path);

      if (requiresAuth) {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      // Accept header can be set universally
      config.headers.Accept = 'application/json';
    } catch (e) {
      // silently ignore token read errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Welcome API
export const fetchWelcomeData = async () => {
  try {
    const response = await apiClient.get('welcome');
    return response.data;
  } catch (error) {
    console.error('Error fetching welcome data:', error);
    throw error;
  }
};

export const onAddCommonJsonApi = async (dataUrl, requestData) => {
  const token = await AsyncStorage.getItem('token');
  const url = API_BASE_URL + dataUrl;
  console.log('Get Login Url:::', url);
  return new Promise((resolve, reject) => {
    axios
      .post(url, requestData, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const onAddCommonFormApi = async (dataUrl, requestData) => {
  const token = await AsyncStorage.getItem('token');
  const url = API_BASE_URL + dataUrl;
  console.log('Get Login Url:::', url);
  return new Promise((resolve, reject) => {
    axios
      .post(url, requestData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      })
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const onGetCommonApi = async urlData => {
  const token = await AsyncStorage.getItem('token');
  const url = API_BASE_URL + urlData;
  console.log('Get Url:::', url);
  return new Promise((resolve, reject) => {
    axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

// Login API
export const loginUser = async (country, phone, pushToken) => {
  try {
    const response = await apiClient.post('login', {
      country: country,
      phone: phone,
      push_notification: pushToken,
    });
    return response.data;
  } catch (error) {
    console.error('Error during login:', error.response);
    throw error;
  }
};

// Resend Code API
export const resendCode = async (user_id) => {
  try {
    const response = await apiClient.post('resendCode', {
      user_id: user_id,
    });
    return response.data;
  } catch (error) {
    console.error('Error resending code:', error);
    throw error;
  }
};

// Verify Code API
export const verifyCode = async (user_id, vcode) => {
  try {
    const response = await apiClient.post('verifyCode', {
      user_id: user_id,
      vcode: vcode,
    });
    return response.data;
  } catch (error) {
        console.error('Error during login:', error.response.data);

    throw error;
  }
};

// Astrologer API
export const fetchAstrologerData = async () => {
  try {
    const response = await apiClient.get('astrologer');
    return response.data;
  } catch (error) {
    console.error('Error fetching astrologer data:', error.response.data);
    throw error;
  }
};

// Homepage Data API
export const fetchHomepageData = async () => {
  try {
    const response = await apiClient.get('homepageData');
    return response.data;
  } catch (error) {
    console.error('Error fetching homepage data:', error.response?.data || error);
    throw error;
  }
};

// Chat API
export const sendChatMessage = async (userMsg, astrologer) => {
  try {
    const response = await apiClient.post('chat', {
      user_msg: userMsg,
      astrologer: JSON.stringify(astrologer),
    });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

// Chat History API
export const fetchChatHistory = async () => {
  try {
    const response = await apiClient.get('chat/history');
    return response.data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

export const fetchChatList = async () => {
  try {
    const response = await apiClient.get('chat-list');
    return response.data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

// Session History API
export const fetchSessionHistory = async (sessionId) => {
  try {
    const response = await apiClient.get(`chat/session?session_id=${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching session history:', error.response.data);
    throw error;
  }
};

// Start Chat API
export const startChat = async (astroId) => {
  try {
    const response = await apiClient.post('chat/start', {
      astrologer_id: astroId
    });
    return response.data;
  } catch (error) {
    console.error('Error starting chat:', error.response.data);
    throw error;
  }
};

// Send Message API
export const sendMessage = async (sessionId, message) => {
  try {
    const response = await apiClient.post('chat/send', {
      session_id: sessionId,
      message: message,
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.response.data);
    throw error;
  }
};

// Kundali API
export const generateKundali = async (formData) => {
  try {
    const response = await apiClient.post('kundali', {
      user_info: formData,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating kundali:', error.response.data);
    throw error;
  }
};


// Horoscope API
export const generateHoroscope = async (formData) => {
  try {
    const response = await apiClient.post('horoscope', {
      user_info: formData,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating horoscope:', error);
    throw error;
  }
};

// Predication API
export const generatePredication = async (formData) => {
  try {

    const response = await apiClient.post('predication', {
      user_info: formData,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating predication:', error);
    throw error;
  }
};

// Match API
export const generateMatch = async (user1, user2) => {
  try {
    const response = await apiClient.post('match', {
      my_info: user1,
      partner_info: user2,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating match:', error);
    throw error;
  }
};

// Baby API
export const generateBaby = async (formData) => {
  try {
    const response = await apiClient.post('baby', {
      user_info: formData,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating baby:', error);
    throw error;
  }
};

// End Chat API
export const endChat = async (sessionId) => {
  try {
    // Prefer POST with JSON body
    const response = await apiClient.post('chat/end', { session_id: sessionId });
    return response.data;
  } catch (error) {
    // Fallback to GET with query param if POST unsupported
    try {
      const response = await apiClient.get(`chat/end?session_id=${encodeURIComponent(sessionId)}`);
      return response.data;
    } catch (err) {
      console.error('Error ending chat:', err?.response?.data || err);
      throw err;
    }
  }
};

// Account API
export const fetchAccount = async () => {
  try {
    const response = await apiClient.get('account');
    return response.data;
  } catch (error) {
    console.error('Error fetching account:', error.response?.data || error);
    throw error;
  }
};

// Update Account API
export const updateAccount = async (name, email) => {
  try {
    const response = await apiClient.post('accountUpdate', {
      name: name,
      email: email,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating account:', error.response?.data || error);
    throw error;
  }
};

// Wallet API
export const fetchWalletData = async () => {
  try {
    const response = await apiClient.get('wallet');
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet data:', error.response?.data || error);
    throw error;
  }
};

// Create Stripe Payment Intent for Wallet top-up
export const createWalletPaymentIntent = async (amount) => {
  try {
    const response = await apiClient.post('wallet/stripe-intent', {
      amount: amount,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating wallet payment intent:', error.response?.data || error);
    throw error;
  }
};

// Create Razorpay order for Wallet top-up
export const createWalletRazorpayOrder = async (amount) => {
  try {
    const response = await apiClient.post('wallet/razorpay', {
      amount: amount,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Razorpay order:', error.response?.data || error);
    throw error;
  }
};

//get api key
export const getApiKeys = async (amount) => {
  try {
    const response = await apiClient.get('getApiKeys');

    return response;
  } catch (error) {
    console.error('Error:', error?.response?.data);
    throw error;
  }
};

export const getPush = async (amount) => {
  try {
    const response = await apiClient.get('getPush');

    return response;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
};

export const getAiHistory = async () => {
  try {
    const response = await apiClient.get('ai-history-list');

    return response;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
};

export const getAiHistoryDetail = async (id) => {
  try {
    const response = await apiClient.get('ai-history-detail/'+id);

    return response;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
};

export const logout = async (amount) => {
  try {
    const response = await apiClient.get('logout');

    return response;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
};

export const deleteAccount = async (dlt) => {
  try {
    const response = await apiClient.post('deleteAccount', {
      delete: dlt,
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting account:', error.response?.data || error);
    throw error;
  }
};

export const updateAIChat = async (dlt) => {
  try {
    const response = await apiClient.post('update-ai-chat-for-astrologers', {
      ai_chat: dlt,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating AI chat:', error.response?.data || error);
    throw error;
  }
};

// Contact support
export async function sendContact(subject, category, message) {
  try {
    const payload = { subject, category, message };
    const res = await apiClient.post('contact', payload);
    return res.data;
  } catch (e) {
    console.log('sendContact error', e?.response?.data || e.message);
    throw e;
  }
}

//add Wallet
export const addWallet = async (amount, payment_method) => {
  try {
    const response = await apiClient.post('addWallet', {
      amount: amount,
      payment_method: payment_method,
    });
    return response;
  } catch (error) {
    console.error('Error adding to wallet:', error.response?.data || error);
    throw error;
  }
};