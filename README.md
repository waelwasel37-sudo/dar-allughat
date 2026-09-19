# Dar Allughat - Your Gateway to Knowledge

Welcome to the official repository for the Dar Allughat digital platform. Our mission is to provide a rich, secure, and performant educational environment for all users.

This project is a hybrid Next.js application, strategically built to leverage:

- **Static Site Generation (SSG/ISR):** For lightning-fast load times, superior SEO, and cost-effective hosting.
- **Server-Side Rendering (SSR):** For dynamic pages that require real-time data.

This approach ensures a platform that is **Secure, Fast, Robust, and Easy to Maintain**.

---

##  Project Setup & Local Development

To run this project locally, you must first configure your environment variables. This method is secure and prevents exposing sensitive credentials.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20.x or later)
- [npm](https://www.npmjs.com/)

### 1. Installation

First, install the project dependencies:

```bash
npm install
```

### 2. Environment Variables

This project requires a Firebase service account to securely connect to the backend and fetch data during the build process (e.g., for generating the sitemap).

**Do NOT commit service account keys to the repository.**

Create a file named `.env.local` in the root of the project. Add the following environment variables to it, replacing the placeholder values with your actual Firebase service account credentials:

```
# .env.local

# Firebase Project Credentials
# Replace with your Firebase project ID
FIREBASE_PROJECT_ID="your-project-id"

# Replace with your service account's client email
FIREBASE_CLIENT_EMAIL="your-client-email@gserviceaccount.com"

# Replace with your service account's private key
# IMPORTANT: Enclose the key in double quotes and ensure all newline characters are preserved.
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your...private...key...\n-----END PRIVATE KEY-----\n"

```

**How to get your credentials:**

1. Go to your Firebase Project Settings.
2. Navigate to the "Service accounts" tab.
3. Click "Generate new private key". A JSON file will be downloaded.
4. Open the JSON file and copy the `project_id`, `client_email`, and `private_key` values into your `.env.local` file.

### 3. Running the Development Server

Once the environment variables are set, you can start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### 4. Building for Production

The build process is now fully automated and secure. It will automatically generate the sitemap before creating the final production build.

To create a production build, run:

```bash
npm run build
```

**Note:** The build command (`ts-node --esm generateSitemap.ts && next build`) relies on the environment variables being available in the build environment. For local builds, the `.env.local` file handles this. For deployment platforms (like Vercel, Netlify, etc.), you must set these environment variables in the platform's dashboard.
