const express = require("express");
const admin = require("firebase-admin");

const app = express();
app.use(express.json());

// 🔥 FIREBASE KEY (Render ENV)
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// =======================================
// 🔥 AUTO NOTIFICATION (REAL TIME)
// =======================================
db.collection("chats").onSnapshot((snapshot) => {
  snapshot.docChanges().forEach(async (change) => {
    if (change.type === "modified") {
      const data = change.doc.data();

      const lastMessage = data.lastMessage;
      const senderId = data.lastSenderId;
      const users = data.users;

      if (!users || users.length < 2) return;

      const receiverId = users.find((u) => u !== senderId);

      try {
        // 🔥 RECEIVER TOKEN
        const userDoc = await db.collection("users").doc(receiverId).get();
        const token = userDoc.data()?.fcmToken;

        if (token && lastMessage) {
          await admin.messaging().send({
            token: token,

            notification: {
              title: "New Message 💬",
              body: lastMessage,
            },

            // 🔥 VERY IMPORTANT (chat open)
            data: {
              senderId: senderId,
              chatId: change.doc.id,
            },
          });

          console.log("🔥 Auto Notification Sent");
        }
      } catch (e) {
        console.log("❌ Notification Error:", e);
      }
    }
  });
});

// =======================================
// 🔥 MANUAL API (optional)
// =======================================
app.post("/send", async (req, res) => {
  const { token, message } = req.body;

  try {
    await admin.messaging().send({
      token: token,
      notification: {
        title: "New Message 💬",
        body: message,
      },
    });

    res.send("Notification Sent ✅");
  } catch (e) {
    console.log(e);
    res.send("Error ❌");
  }
});

// =======================================
// 🔥 SERVER START (Render Compatible)
// =======================================
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});