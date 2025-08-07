# Quick Start Guide (Free Plan)

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
# Run the setup script to create .env file
npm run setup

# Follow the instructions to get your Gemini API key
```

### 3. Get Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Replace `your-gemini-api-key-here` in the `.env` file with your actual API key

### 4. Firebase Setup (Free Plan)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Enable Firestore Database (test mode)
4. Enable Hosting
5. Get your config from Project Settings → General → Your apps → Web app

### 5. Update Firebase Config
Edit `src/firebase.js` with your Firebase config:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

### 6. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 7. Run the App
```bash
npm start
```

## 🎯 Test the System

1. **Create an NPC**:
   - Click "Create New NPC"
   - Fill in details (name, personality, etc.)
   - Click "Create NPC"

2. **Chat with NPC**:
   - Select your NPC from the sidebar
   - Type a message
   - See AI-generated response in character

3. **Try Features**:
   - Use dialogue options (if available)
   - Click "Translate" on NPC responses
   - Create multiple NPCs

## 🔧 Troubleshooting

- **API errors**: 
  - Check Gemini API key is set in `.env` file
  - Run `npm run setup` to verify configuration
  - Restart development server after changing `.env`
- **Firestore errors**: Verify firestore.rules are deployed
- **CORS issues**: Ensure Firebase project is configured correctly

## 💡 Free Plan Benefits

- ✅ No credit card required
- ✅ 1GB Firestore storage
- ✅ 50K reads/day, 20K writes/day
- ✅ 10GB hosting storage
- ✅ 360MB/day hosting transfer
- ✅ No external API restrictions

## 📞 Support

Check the main README.md for detailed documentation and troubleshooting. 