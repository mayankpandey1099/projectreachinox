
const { Client } = require("@microsoft/microsoft-graph-client");
const {
  PublicClientApplication,
  ConfidentialClientApplication,
} = require("@azure/msal-node");
const {generateAutoReply} = require("../utils/outlookReply");


const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tenantId = process.env.TENANT_ID;
const redirectUri = "http://localhost:3000";
const scopes = ["https://graph.microsoft.com/.default"];

const msalConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
  },
};

const pca = new PublicClientApplication(msalConfig);

const ccaConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    clientSecret,
  },
};

const cca = new ConfidentialClientApplication(ccaConfig);

const signin = (req, res) => {
  const authCodeUrlParameters = {
    scopes,
    redirectUri,
  };

  pca
    .getAuthCodeUrl(authCodeUrlParameters)
    .then((response) => {
      res.redirect(response);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
};

const outlookCallback = (req, res) => {
  const tokenRequest = {
    code: req.query.code,
    scopes,
    redirectUri,
    clientSecret,
    authority: `https://login.microsoftonline.com/${tenantId}`,
  };

  cca
    .acquireTokenByCode(tokenRequest)
    .then((response) => {
      // Store the user-specific access token in the session for future use
      req.session.userAccessToken = response.accessToken;
      // redirecting the user to fetch mail and send auto reply on that  basis
      res.redirect("/get-mails");
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
};

const getMails = async (req, res) => {
  try {
    const userAccessToken = req.session.userAccessToken;
    if (!userAccessToken) {
      return res
        .status(401)
        .send("User not authenticated. Please sign in first.");
    }

    const client = Client.init({
      authProvider: (done) => {
        done(null, userAccessToken);
      },
    });

    const messages = await client
      .api(
        "https://graph.microsoft.com/v1.0/me/messages?$filter=isRead eq false"
      )
      .get();
    const emails = messages.value.map((email) => {
      return {
        subject: email.subject,
        bodyPreview: email.bodyPreview,
        fromEmail: email.from.emailAddress.address,
        fromName: email.from.emailAddress.name,
        content: email.body.content,
        toName: email.toRecipients[0].emailAddress.name,
        toEmail: email.toRecipients[0].emailAddress.address,
      };
    });

    emails.forEach((message) => {
      generateAutoReply(userAccessToken, message, sendAutoMail);
    });
    res
      .status(200)
      .send(
        "Emails successfully fetched and auto-replies sent for all emails."
      );
  } catch (error) {
    res.status(500).send(error);
    console.log("Error fetching messages:", error.message);
  }
};

const sendAutoMail = async (
  recipient,
  generatedReply,
  generatedSubject,
  useraccessToken
) => {
  try {
    // Check if the user and client are authenticated
    if (!useraccessToken) {
      return res
        .status(401)
        .send("User not authenticated. Please sign in first.");
    }

    // Initialize the Microsoft Graph API client using the user access token
    const client = Client.init({
      authProvider: (done) => {
        done(null, useraccessToken);
      },
    });

    // Prepare the email data
    const sendMail = {
      message: {
        subject: generatedSubject,
        body: {
          contentType: "Text",
          content: generatedReply,
        },
        toRecipients: [
          {
            emailAddress: {
              address: recipient,
            },
          },
        ],
      },
      saveToSentItems: true,
    };
    // Send the email using the Microsoft Graph API
    const response = await client.api("/me/sendMail").post(sendMail);
    return response;
  } catch (error) {
    console.log("Error sending message:", error.message);
    throw error;
  }
};




module.exports = {signin, outlookCallback, getMails, sendAutoMail};