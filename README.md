# AI NPC Generator

A modern web application for creating and chatting with AI-powered NPCs (Non-Player Characters) using React, Firebase (Free Plan), and Google's Gemini AI.

## 🚀 Features

- **NPC Creation**: Create detailed NPC profiles with personality, backstory, voice patterns, and more
- **AI Chat**: Real-time conversations with AI-powered NPCs that maintain character consistency
- **Dialogue Options**: AI-generated response suggestions for branching conversations
- **Translation**: Built-in translation feature for NPC responses
- **Modern UI**: Beautiful, responsive interface with smooth animations
- **Free Plan Compatible**: Works with Firebase's free Spark plan

## 🏗️ Architecture

```
React Frontend → Google Gemini API → Firebase Firestore Database
```

- **Frontend**: React with modern CSS and responsive design
- **AI Service**: Direct integration with Google Gemini API from frontend
- **Database**: Cloud Firestore (NoSQL) - Free plan compatible
- **AI**: Google Gemini API for natural language generation
- **Hosting**: Firebase Hosting (Free plan compatible)

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account (Free plan)
- Google AI Studio account (for Gemini API)

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-npc-generator

# Install dependencies
npm install
```

### 2. Environment Setup (Quick Start)

```bash
# Run the setup script to create .env file
npm run setup

# Or manually create .env file in the root directory:
echo "REACT_APP_GEMINI_API_KEY=your-gemini-api-key-here" > .env
```

### 3. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Replace `your-gemini-api-key-here` in the `.env` file with your actual API key

### 4. Firebase Project Setup (Free Plan)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable the following services:
   - **Firestore Database**: Create in test mode (Free plan compatible)
   - **Hosting**: Enable for deployment (Free plan compatible)

### 5. Firebase Configuration

1. Get your Firebase config:
   - Go to Project Settings → General
   - Scroll down to "Your apps" section
   - Click "Add app" → Web app
   - Copy the config object

2. Update `src/firebase.js`:
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
# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### 7. Run the Application

```bash
# Start development server
npm start
```

The application will be available at `http://localhost:3000`

## 🎮 Usage

### Creating NPCs

1. Click "Create New NPC" tab
2. Fill in the NPC details:
   - **Name**: Character's name
   - **Race**: Character's race (e.g., Wood Elf, Human)
   - **Profession**: Character's occupation
   - **Personality**: Detailed personality traits and quirks
   - **Voice**: Speech patterns, accents, mannerisms
   - **Backstory**: Character's history and background

3. Click "Create NPC" to save

### Chatting with NPCs

1. Select an NPC from the sidebar
2. Start typing in the chat input
3. The AI will respond in character based on the NPC's profile
4. Use dialogue options for branching conversations
5. Click "Translate" to translate NPC responses

## 📁 Project Structure

```
ai-npc-generator/
├── public/                 # Static files
├── src/
│   ├── components/         # React components
│   │   ├── NpcCreator.js   # NPC creation form
│   │   ├── NpcList.js      # NPC selection list
│   │   └── ChatWindow.js   # Chat interface
│   ├── services/           # External services
│   │   └── aiService.js    # Gemini AI integration
│   ├── App.js             # Main app component
│   ├── firebase.js        # Firebase configuration
│   └── index.js           # App entry point
├── firebase.json          # Firebase configuration
├── firestore.rules        # Database security rules
├── setup-env.js           # Environment setup script
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

The app uses a `.env` file in the root directory:
```env
REACT_APP_GEMINI_API_KEY=your-gemini-api-key-here
```

**Important**: Never commit your actual API key to version control. The `.env` file is already added to `.gitignore`.

### Firebase Configuration

The app uses Firebase's free Spark plan with:
- **Firestore Database**: For storing NPCs and conversations
- **Firebase Hosting**: For deploying the web app
- **No Functions**: AI calls are made directly from frontend

## 🚀 Deployment

### Deploy to Firebase Hosting

```bash
# Build the React app
npm run build

# Deploy to Firebase
firebase deploy
```

### Deploy Firestore Rules Only

```bash
firebase deploy --only firestore:rules
```

## 🔒 Security

- Firestore rules are set to allow all access for development
- In production, implement proper authentication and authorization
- API keys are stored in environment variables (frontend only for this setup)
- `.env` file is excluded from version control

## 🐛 Troubleshooting

### Common Issues

1. **API key errors**: 
   - Verify Gemini API key is set in `.env` file
   - Run `npm run setup` to check configuration
   - Restart development server after changing `.env`

2. **Firestore permission errors**: Check firestore.rules configuration
3. **CORS issues**: Ensure Firebase project is configured correctly

### Debug Mode

```bash
# Run Firebase emulators for local development
firebase emulators:start
```

## 💡 Free Plan Limitations

This setup works with Firebase's free Spark plan:
- ✅ Firestore Database (1GB storage, 50K reads/day, 20K writes/day)
- ✅ Firebase Hosting (10GB storage, 360MB/day transfer)
- ✅ No Functions needed (AI calls from frontend)
- ✅ No external API restrictions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini AI for natural language processing
- Firebase for backend infrastructure (free plan)
- React community for the amazing framework 