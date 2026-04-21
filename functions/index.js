const functions = require("firebase-functions");
const {GoogleAuth} = require("google-auth-library");

const {
  RtcTokenBuilder,
  RtcRole,
} = require("agora-token");

exports.generateToken = functions.https.onCall(async (data, context) => {
  const appId = data.appId;
  const appCertificate = data.appCertificate;
  const channelName = Math.floor(Math.random() * 100).toString();
  const uid = data.uid;
  const role = RtcRole.PUBLISHER;

  const expirationTimeInSeconds = 36000;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  if (channelName === undefined || channelName === null) {
    throw new functions.https.HttpsError(
      "aborted",
      "Channel name is required",
    );
  }

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
    );

    return {
      data: {
        token: token,
        channelName: channelName,
      },
    };
  } catch (err) {
    throw new functions.https.HttpsError(
      "aborted",
      "Could not generate token",
    );
  }
});

exports.generateAccessToken = functions.https.onCall(async (data, context) => {
  try {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    return {
      token: accessToken.token,
    };
  } catch (error) {
    console.error("Error generating token:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Unable to generate access token",
    );
  }
});
