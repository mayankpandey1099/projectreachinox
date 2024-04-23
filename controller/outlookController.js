
// const { Queue, Worker } = require("bullmq");
// const connection = require("../utils/redisConfig");
// const { sendAutoReply } = require("../utils/emailUtils");
const axios = require("axios");

// // Create a queue for processing Gmail auto-reply jobs
// const queue = new Queue("outlook-auto-reply-queue", {
//   connection: connection,
// });
const { Client } = require("@microsoft/microsoft-graph-client");
const jwt = require("jsonwebtoken");
const {
  PublicClientApplication,
  ConfidentialClientApplication,
  InteractionRequiredAuthError,
  ClientConfigurationError,
  AuthError,
} = require("@azure/msal-node");
const clientId = process.env.OUTLOOK_CLIENT_ID;
const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
const tenantId = process.env.OUTLOOK_TENANT_ID;
const redirectUri = "http://localhost:3000/auth/outlook/callback";
const scopes = [
  "https://graph.microsoft.com/.default",
];


const msalConfig = {
  auth: {
    clientId: clientId,
    authority: `https://login.microsoftonline.com/common/${tenantId}`,
    clientSecret: clientSecret,
  },
};

const pca = new PublicClientApplication(msalConfig);

const authenticate = (req, res) => {
  // const authCodeUrlParameters = {
  //   scopes: scopes,
  //   redirectUri: redirectUri,
  // };

  // pca
  //   .getAuthCodeUrl(authCodeUrlParameters)
  //   .then((response) => {
  //     res.redirect(response);
  //   })
  //   .catch((error) => {
  //     console.log(error);
  //     res.status(500).send("Error redirecting for authentication");
  //   });
  const authCodeUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=${encodeURIComponent(
    scopes.join(" ")
  )}&state=12345`;
  res.redirect(authCodeUrl);
};

let accessToken;
const outlookCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code missing.");
  }
  // console.log(code)

  try {
    const tokenRequest = {
      client_id: clientId,
      client_secret: clientSecret, // Include client secret here
      code: code,
      scope: scopes.join(" "),
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    };
    //console.log("Token Request in outlookCallback:", tokenRequest);
    // const response = await pca.acquireTokenByCode(tokenRequest);
    // req.session.accessToken = response.accessToken;
    // accessToken = response.accessToken;
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams(tokenRequest),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    //console.log("this is tokenResponse", tokenResponse.data.access_token);
    accessToken = tokenResponse.data.access_token;
  
    //req.session.accessToken = accessToken;
    //console.log("this is accessToken in outlookcallback",accessToken);
    res.redirect("/auth/get-user-profile");
  } catch (error) {
    console.error("Error exchanging authorization code:", error.message);
    res.status(500).send("Error exchanging authorization code.");
  }
};

// const getUserProfile = async () => {
//   try {

//     const decodedToken = jwt.decode(accessToken);
//     console.log(decodedToken);
//     // const client = Client.init({
//     //   authProvider: (done) => {
//     //     done(null, accessToken);
//     //   },
//     // });
//     //  const userProfile = await client.api("/me").get();

//     // console.log("User profile: in getUserProfile", userProfile);
//   } catch (error) {
//     console.error("Error fetching user profile:", error);
//   }
// };
const getUserEmails = async () => {
  try {
    // Decode the access token to get user information
    decodedToken = jwt.decode(accessToken);

    // // Extract the user's email address from the decoded token
    // const userEmail = decodedToken.email;
    console.log("token decoded:", decodedToken);

    // const token1 = jwt.decode(
    //   "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Imk2bEdrM0ZaenhSY1ViMkMzbkVRN3N5SEpsWSJ9.eyJhdWQiOiI2ZTc0MTcyYi1iZTU2LTQ4NDMtOWZmNC1lNjZhMzliYjEyZTMiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3YyLjAiLCJpYXQiOjE1MzcyMzEwNDgsIm5iZiI6MTUzNzIzMTA0OCwiZXhwIjoxNTM3MjM0OTQ4LCJhaW8iOiJBWFFBaS84SUFBQUF0QWFaTG8zQ2hNaWY2S09udHRSQjdlQnE0L0RjY1F6amNKR3hQWXkvQzNqRGFOR3hYZDZ3TklJVkdSZ2hOUm53SjFsT2NBbk5aY2p2a295ckZ4Q3R0djMzMTQwUmlvT0ZKNGJDQ0dWdW9DYWcxdU9UVDIyMjIyZ0h3TFBZUS91Zjc5UVgrMEtJaWpkcm1wNjlSY3R6bVE9PSIsImF6cCI6IjZlNzQxNzJiLWJlNTYtNDg0My05ZmY0LWU2NmEzOWJiMTJlMyIsImF6cGFjciI6IjAiLCJuYW1lIjoiQWJlIExpbmNvbG4iLCJvaWQiOiI2OTAyMjJiZS1mZjFhLTRkNTYtYWJkMS03ZTRmN2QzOGU0NzQiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhYmVsaUBtaWNyb3NvZnQuY29tIiwicmgiOiJJIiwic2NwIjoiYWNjZXNzX2FzX3VzZXIiLCJzdWIiOiJIS1pwZmFIeVdhZGVPb3VZbGl0anJJLUtmZlRtMjIyWDVyclYzeERxZktRIiwidGlkIjoiNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3IiwidXRpIjoiZnFpQnFYTFBqMGVRYTgyUy1JWUZBQSIsInZlciI6IjIuMCJ9.pj4N-w_3Us9DrBLfpCt"
    // );
    // console.log("microsoft code", token1);

    // Make a GET request to the Microsoft Graph API to retrieve the user's emails
    const response = await axios.get(
      "https://graph.microsoft.com/v1.0/me/messages",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // // Extract the emails from the response
    //const emails = response.data.value;
    console.log("User response:", response);
  } catch (error) {
    console.error("Error fetching user emails:", error);
  }
};

// const outlookAccessToken = async (req, res) => {
//   try {
//     const tokenRequest = {
//       auth: {
//         client_id: clientId,
//         client_secret: clientSecret,
//         authority: `https://login.microsoftonline.com/${tenantId}`,
//       },
//       scope: scopes,
//     };

//     const response = await pca.acquireTokenByClientCredential(tokenRequest);
//     req.session.clientAccessToken = response.accessToken;
//     clientAccessToken = response.accessToken;
//     console.log("this is client token in outlookAccessToken", clientAccessToken);
//     res.send("Access token acquired successfully!");
//   } catch (error) {
//     console.error("Error acquiring client access token:", error.message);
//     res.status(500).send("Error acquiring client access token.");
//   }
// };

// const getMailsOutlook =  async (req, res) => {
//   const num = req.params.num;

//   try {
//     const userAccessToken = accessToken;
//     const clientAccess = clientAccessToken;
//     console.log(userAccessToken)
//     console.log(clientAccess)
//     if (!userAccessToken) {
//       return res
//         .status(401)
//         .send("User not authenticated. Please sign in first.");
//     }

//     if (!clientAccess) {
//       return res
//         .status(401)
//         .send(
//           "Client not authenticated. Please acquire the client access token first."
//         );
//     }

//     const client = Client.clientAccessToken({
//       authProvider: (done) => {
//         done(null, userAccessToken);
//       },
//     });

//     const messages = await client.api("/me/messages").top(num).get();
//     res.send(messages);
//   } catch (error) {
//     res.status(500).send(error);
//     console.log("Error fetching messages:", error.message);
//   }
// };


// const sendMailsOutlook = async (req, res) => {
//   const recipient = req.params.recipient;

//   try {
//     // Retrieve the user and client access tokens from the session
//     const userAccessToken = req.session.accessToken;
//     const clientAccessToken = req.session.clientAccessToken;

//     // Check if the user and client are authenticated
//     if (!userAccessToken) {
//       return res
//         .status(401)
//         .send("User not authenticated. Please sign in first.");
//     }

//     if (!clientAccessToken) {
//       return res
//         .status(401)
//         .send(
//           "Client not authenticated. Please acquire the client access token first."
//         );
//     }

//     // Initialize the Microsoft Graph API client using the user access token
//     const client = Client.init({
//       authProvider: (done) => {
//         done(null, userAccessToken);
//       },
//     });

//     // Prepare the email data
//     const sendMail = {
//       message: {
//         subject: "Wanna go out for lunch?",
//         body: {
//           contentType: "Text",
//           content: "I know a sweet spot that just opened around us!",
//         },
//         toRecipients: [
//           {
//             emailAddress: {
//               address: recipient,
//             },
//           },
//         ],
//       },
//       saveToSentItems: false,
//     };

//     // Send the email using the Microsoft Graph API
//     const response = await client.api("/me/sendMail").post(sendMail);
//     res.send(response);
//   } catch (error) {
//     res.status(500).send(error);
//     console.log("Error sending message:", error.message);
//   }
// };


//getMailsOutlook, sendMailsOutlook

module.exports = { authenticate, outlookCallback, getUserEmails};

// const scope = [
//   "openid",
//   "profile",
//   "offline_access",
//   "https://outlook.office.com/Mail.Read",
//   "https://outlook.office.com/Mail.Send",
//   "https://graph.microsoft.com/.default",
// ];


// const outlookHandler = async (req, res) => {
//   try{
//     const {accessToken} = req.user.tokens; // Access token obtained during authentication
//     console.log(accessToken);
//     const client = Client.init({
//         authProvider: (done) => {
//             done(null, accessToken);
//         }
//     });

//     client
//         .api('/me/mailfolders/inbox/messages')
//         .filter('isRead eq false')
//         .get()
//         .then((response) => {
//           console.log("Unread emails:", response.value);
//             res.json(response.value);
//         })
//         .catch((error) => {
//           console.error("Error retrieving unread emails:", error);
//           res.status(500).json({ error: 'Error retrieving unread emails' });
//         });













// //     const accessToken = await getAccessToken();
// //     const unreadEmails = await fetchUnreadEmails(accessToken);
// //     // console.log("this is the user in the controller", req.user);
// //     // const accessToken = req.user.tokens.accessToken;

// //     // console.log("i am inside controller nd this is access token", accessToken);

// //     // const authProvider = new ClientCredentialProvider({
// //     //   auth: {
// //     //     clientId,
// //     //     clientSecret,
// //     //     tenantId,
// //     //   },
// //     // });

// //     // Initialize Microsoft Graph client
// //     // const outlookClient = Client.initWithMiddleware({authProvider});

// //     // Initialize a worker to process queued auto-reply jobs
// //     const worker = new Worker(
// //       "outlook-auto-reply-queue",
// //       async (job) => {
// //         try {
// //           const { message } = job.data;

// //           // Fetch message details from Microsoft Graph API
// //           const accessToken = await getAccessToken();
// //           const response = await axios.get(
// //             `https://graph.microsoft.com/v1.0/me/messages/${message.id}`,
// //             {
// //               headers: {
// //                 Authorization: `Bearer ${accessToken}`,
// //               },
// //             }
// //           );
// //           const messageDetails = response.data;

// //           // Send auto-reply
// //           await sendAutoReply(messageDetails, "outlook");
// //         } catch (error) {
// //           console.error("Error processing auto-reply job:", error);
// //         }
// //       },
// //       { connection: connection }
// //     );

// //     // Fetch unread emails from Outlook using Microsoft Graph API
// //     // const response = await outlookClient.api("/me/messages").get();
// //     // const unreadEmails = response.data.value;
    

// //     // If no unread emails found, send response and return
// //     if (unreadEmails.length === 0) {
// //       console.log("No unread emails found.");
// //       return res.status(200).send("No unread emails found.");
// //     }

// //     // Add each unread email to the queue for processing
// //     for (const email of unreadEmails) {
// //       await queue.add("send-auto-reply", { message: email });
// //     }

// //     // Send success response
// //     res.status(200).send("Auto reply enabled successfully!");
// //   } catch (error) {
// //     console.error("Error generating or sending reply message:", error);
// //     res
// //       .status(500)
// //       .send("Error generating or sending reply message: " + error.message);
// //   }
// // };

// // async function getAccessToken() {
// //   try {
// //     const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

// //     // Log the token endpoint URL
// //     console.log("Token Endpoint:", tokenEndpoint);

// //     const requestBody = {
// //       client_id: clientId,
// //       client_secret: clientSecret,
// //       scope: scope.join(" "),
// //       grant_type: "client_credentials",
// //     };
// //     // Log the request body
// //     console.log("Request Body:", requestBody);

// //     const response = await axios.post(tokenEndpoint, requestBody);

// //     console.log("response data", response.data);
// //     console.log("this is token in getAccessToken", response.data.access_token);

// //     return response.data.access_token;
// //   } catch (error) {
// //     console.error("Error getting access token:", error);
// //     throw error;
// //   }
// // }

// // async function fetchUnreadEmails(accessToken) {
// //   try {
// //     const apiUrl =
// //       "https://graph.microsoft.com/v1.0/me/messages?$filter=isRead eq false";

// //     const response = await axios.get(apiUrl, {
// //       headers: {
// //         Authorization: `Bearer ${accessToken}`,
// //       },
// //     });

// //     return response.data.value;
// //   } catch (error) {
// //     console.error("Error fetching unread emails:", error);
// //     throw error;
// //   }
// } catch(err){
//       console.error("error fetching mails", err);
// }
// }

// module.exports = { outlookHandler };









// async function authenticate(code) {
//   try {
//     if (code) {
//       // Use the authorization code to acquire the access token
//       const tokenResponse = await pca.acquireTokenByCode({
//         scopes,
//         code,
//         redirectUri,
//       });
//       return tokenResponse.accessToken;
//     } else {
//       // Create authorization code URL parameters
//       const authCodeUrlParameters = {
//         scopes,
//         redirectUri,
//       };

//       // Get authorization code URL
//       const authCodeUrl = await pca.getAuthCodeUrl(authCodeUrlParameters);
//       return authCodeUrl;
//     }
//   } catch (error) {
//     console.error("Authentication error:", error);
//     throw error;
//   }
// }

