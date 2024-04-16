
// Import required modules
const { google } = require("googleapis");
const { Queue, Worker } = require("bullmq"); 
const connection = require("../utils/redisConfig");
const {sendAutoReply} = require("../utils/emailUtils");


// Create a queue for processing Gmail auto-reply jobs
const queue = new Queue("gmail-auto-reply-queue", {
  connection: connection,
});

const gmailHandler = async (req, res) => {
  const { accessToken, refreshToken } = req.user.tokens;

  // Initialize OAuth2 client for Gmail authentication
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:3000/auth/google/callback"
  );

  // Set OAuth2 credentials
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Initialize Gmail API instance with authenticated OAuth2 client
  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
  });

  // Initialize a worker to process queued auto-reply jobs
  const worker = new Worker(
    "gmail-auto-reply-queue",
    async (job) => {
      // Process each job by fetching message details and sending auto-reply
      const { message } = job.data;
      const messageDetails = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "full",
      });
      await sendAutoReply(gmail, messageDetails.data, "gmail");
    },
    { connection: connection }
  );

  try {
    // Fetch unread emails from Gmail
    const response = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
    });

    // Extract messages from response
    const messages = response.data.messages;
    if (messages.length === 0) {
      console.log("No unread emails found.");
      return res.status(200).send("No unread emails found.");
    }

    // Add each unread email to the queue for processing
    for (const message of messages) {
      await queue.add("send-auto-reply", { message });
    }
    res.status(200).send("Auto reply enabled successfully!");
  } catch (error) {
    console.error("Error generating or sending reply message:", error);
    res
      .status(500)
      .send("Error generating or sending reply message: " + error.message);
  }
};


module.exports = {gmailHandler};