// const { ClientSecretCredential } = require("@azure/identity");
const { Client } = require("@microsoft/microsoft-graph-client");
const { Queue, Worker } = require("bullmq");
const connection = require("../utils/redisConfig");
const { sendAutoReply } = require("../utils/emailUtils");

// Create a queue for processing Gmail auto-reply jobs
const queue = new Queue("outlook-auto-reply-queue", {
  connection: connection,
});

const outlookHandler = async (req, res) => {
  try{

    const accessToken = req.user.accessToken;

    // Initialize Microsoft Graph client
    const outlookClient = Client.initWithMiddleware({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    // Initialize a worker to process queued auto-reply jobs
    const worker = new Worker(
      "outlook-auto-reply-queue",
      async (job) => {
        // Process each job by fetching message details and sending auto-reply
        const { message } = job.data;
        const messageDetails = await outlookClient
          .api(`/me/messages/${message.id}`)
          .get();
        await sendAutoReply(outlookClient, messageDetails, "outlook");
      },
      { connection: connection }
    );

    // Fetch unread emails from Outlook using Microsoft Graph API
    const response = await outlookClient.api("/me/messages").get();
    const unreadEmails = response.data.value;

    // If no unread emails found, send response and return
    if (unreadEmails.length === 0) {
      console.log("No unread emails found.");
      return res.status(200).send("No unread emails found.");
    }

    // Add each unread email to the queue for processing
    for (const email of unreadEmails) {
      await queue.add("send-auto-reply", { message: email });
    }

    // Send success response
    res.status(200).send("Auto reply enabled successfully!");
  } catch (error) {
    console.error("Error generating or sending reply message:", error);
    res
      .status(500)
      .send("Error generating or sending reply message: " + error.message);
  }
};

module.exports = { outlookHandler };
