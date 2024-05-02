const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);



const generateAutoReply = async (userAccessToken, message, sendAutoMail) => {
  try {
    // Extract message details
    const useraccessToken = userAccessToken;
    const emailSubject = message.subject;
    const emailBody = message.content;
    const bodyPreview = message.bodyPreview;
    const toName = message.toName;
    const fromName = message.fromName;
    const recipient = message.fromEmail;

    // Categorize email based on its content
    const category = await categorizeEmail({
      subject: emailSubject,
      body: emailBody,
      bodyPreview: bodyPreview,
    });
    let request = "";

    // sending auto-reply request based on email category
    switch (category) {
      case "Interested":
        request = `Read the body ${emailBody} and body preview ${bodyPreview} and write an email on behalf of ${toName}, asking ${fromName} if they are willing to hop on to a demo call by suggesting a time from Mayank Pandey`;
        break;
      case "Not Interested":
        request = `Read the body ${emailBody} and body preview ${bodyPreview} and write an email on behalf of ${toName}, thanking ${fromName} for their time and asking them if they would like to be contacted in the future from Mayank Pandey`;
        break;
      case "More Information":
        request = `Read the body ${emailBody} and body preview ${bodyPreview} and write an email on behalf of ${toName}, asking ${fromName} if they would like more information about the product from Mayank Pandey`;
        break;
      default:
        request = `Read the body ${emailBody} and body preview ${bodyPreview} and write an email on behalf of ${toName}, asking ${fromName} if they are willing to hop on to a demo call by suggesting a time Mayank Pandey`;
    }

    // Generate reply using Gemini AI model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `You received an email with the subject: "${emailSubject}" and body preview ${bodyPreview} and following content: "${emailBody}". ${request} **please only write body content** "**dont add the subject"`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedReply = response.text();
    const prompt1 = `You have received the mail body ${generatedReply} you have to generate the subject for it **"(only subject)" dont write anything else**`;
    const result1 = await model.generateContent(prompt1);
    const response1 = result1.response;
    const generatedSubject = response1.text();

    sendAutoMail(recipient, generatedReply, generatedSubject, useraccessToken);
  } catch (error) {
    console.error("Error generating reply message:", error);
    return "Error generating reply message: " + error.message;
  }
};

const categorizeEmail = async (email) => {
  try {
    // Get generative model for categorization
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate prompt for categorization
    const prompt = `You received an email with the subject: "${email.subject}" and the body ${email.emailBody} and body preview ${email.bodyPreview}". Please categorize this email into one of the following categories - Interested, Not Interested, More Information:`;

    // Generate categorization using generative model
    const result = await model.generateContent(prompt);
    const response = result.response;
    let category = response.text();

    // Check if category is valid
    const validCategories = [
      "Interested",
      "Not Interested",
      "More Information",
    ];
    if (!validCategories.includes(category)) {
      category = "More Information";
    }
    return category;
  } catch (error) {
    console.error("Error categorizing email:", error);
    return "More Information";
  }
};


module.exports = {generateAutoReply};
