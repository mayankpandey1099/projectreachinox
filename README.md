# Project Reachinox

Project Reachinox is a web application that integrates with Gmail and Outlook to automatically categorize and respond to emails using AI-powered auto-replies.

## Features

### Gmail Integration
Seamlessly connects to your Gmail account using OAuth 2.0 authentication.

### Outlook Integration
Integrates with Microsoft Graph API and MSAL for Outlook email handling and authentication.

### Automatic Categorization
Utilizes Google's Generative AI to categorize incoming emails into predefined categories: Interested, Not Interested, More Information.

### AI Auto-Replies
Generates personalized auto-reply emails based on the categorized emails.

### Express.js Backend
Utilizes Express.js to handle server-side routing and logic.

### Passport.js Middleware
Integrates Passport.js for authentication using Google OAuth 2.0 and MSAL for Outlook authentication.

### BullMQ Job Queue
Implements BullMQ for job queuing to handle asynchronous tasks efficiently.

### Redis Integration
Utilizes Redis as a message broker for job queue communication.

## Installation

### Clone the repository:
git clone https://github.com/yourusername/projectreachinox.git

### Install dependencies:
cd projectreachinox
npm install

### Create a .env file in the root directory and add the following variables:
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
API_KEY=your_google_ai_api_key
CLIENT_ID=your_outlook_client_id
CLIENT_SECRET=your_outlook_client_secret
TENANT_ID=your_outlook_tenant_id

DB_NAME=your_db_name
DB_HOST=your_db_host
DB_PASS=your_db_pass

HOST_R=your_redis_host
PASS_R=your_redis_pass



