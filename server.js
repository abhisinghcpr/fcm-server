const express = require("express");
const admin = require("firebase-admin");

const app = express();
app.use(express.json());

const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});