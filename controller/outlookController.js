
const {Client, ClientCredentialProvider} = require("@microsoft/microsoft-graph-client");
const { Queue, Worker } = require("bullmq");
const connection = require("../utils/redisConfig");
const { sendAutoReply } = require("../utils/emailUtils");
const axios = require("axios");

// Create a queue for processing Gmail auto-reply jobs
const queue = new Queue("outlook-auto-reply-queue", {
  connection: connection,
});

const clientId = process.env.OUTLOOK_CLIENT_ID;
const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
const tenantId = process.env.OUTLOOK_TENANT_ID;

const scope = [
  "openid",
  "profile",
  "offline_access",
  "https://outlook.office.com/Mail.Read",
  "https://outlook.office.com/Mail.Send",
];


const outlookHandler = async (req, res) => {
  try{
    const accessToken = await getAccessToken();
    const unreadEmails = await fetchUnreadEmails(accessToken);
    // console.log("this is the user in the controller", req.user);
    // const accessToken = req.user.tokens.accessToken;

    // console.log("i am inside controller nd this is access token", accessToken);

    // const authProvider = new ClientCredentialProvider({
    //   auth: {
    //     clientId,
    //     clientSecret,
    //     tenantId,
    //   },
    // });

    // Initialize Microsoft Graph client
    // const outlookClient = Client.initWithMiddleware({authProvider});

    // Initialize a worker to process queued auto-reply jobs
    const worker = new Worker(
      "outlook-auto-reply-queue",
      async (job) => {
        try {
          const { message } = job.data;

          // Fetch message details from Microsoft Graph API
          const accessToken = await getAccessToken();
          const response = await axios.get(
            `https://graph.microsoft.com/v1.0/me/messages/${message.id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          const messageDetails = response.data;

          // Send auto-reply
          await sendAutoReply(messageDetails, "outlook");
        } catch (error) {
          console.error("Error processing auto-reply job:", error);
        }
      },
      { connection: connection }
    );

    // Fetch unread emails from Outlook using Microsoft Graph API
    // const response = await outlookClient.api("/me/messages").get();
    // const unreadEmails = response.data.value;
    

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

async function getAccessToken() {
  try {
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    // Log the token endpoint URL
    console.log("Token Endpoint:", tokenEndpoint);

    const requestBody = {
      client_id: clientId,
      client_secret: clientSecret,
      scope: scope,
      grant_type: "client_credentials",
    };
    // Log the request body
    console.log("Request Body:", requestBody);

    const response = await axios.post(tokenEndpoint, requestBody);

    console.log("response data", response.data);

    return response.data.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
}

async function fetchUnreadEmails(accessToken) {
  try {
    const apiUrl =
      "https://graph.microsoft.com/v1.0/me/messages?$filter=isRead eq false";

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data.value;
  } catch (error) {
    console.error("Error fetching unread emails:", error);
    throw error;
  }
}

module.exports = { outlookHandler };
