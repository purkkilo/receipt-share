# Receipt Share

> **A React Native app for sharing expenses based on receipts and participants**

[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-blue.svg)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54.0.13-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)

With this app you can read price information from receipts, modify them manually, add your own expenses, and share these expenses product by product.

## 📱 Features

- **Read product names and prices from receipt to digital form**
- **Receipt history** - View yesterday previous receipts
- **Share expenses** - Share the receipt evenly, or select product by product which belongs to whom
- **Share expenses information to other apps**

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (optional, for additional features)

### Installation

```bash
# Clone the repository
git clone https://github.com/purkkilo/receipt-share.git

cd receipt-share

# Install dependencies
npm install
```

### Running the App

```bash
# Start the development server
npm start
```

In the output, you'll find options to open the app in:

- 🔧 **[Development build](https://docs.expo.dev/develop/development-builds/introduction/)** - Full native features
- 🤖 **[Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)** - Android development
- 📱 **[iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)** - iOS development
- 📦 **[Expo Go](https://expo.dev/go)** - Quick preview (limited features)

### Platform-Specific Commands

```bash
# Run on specific platforms
npm run android    # Android
npm run ios        # iOS
npm run web        # Web browser
```

## TODO

- Testing
- Export/import receipts OR cloud storage
- ?

## 🔧 Development

### Project Structure

```
electricity-widget/
├── app/                   # File-based routing (Expo Router)
│   ├── (tabs)/            # Tab navigation screens
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── utils/                 # Utility functions
│   ├── debugTokens.js     # For testing purposes, fine tuning the OCR results
│   ├── parseTokens.ts     # Parse the OCR results to more usefull form
│   └── storageApi.ts      # AsyncStorage handling
│   └── util.ts            # Utility functions used in many components
├── constants/             # App constants
└── scripts/               # Build scripts
```

### Key Technologies

- **[Expo Router](https://docs.expo.dev/router/introduction/)** - File-based navigation
- **[react-native-mlkit-ocr](https://www.npmjs.com/package/react-native-mlkit-ocr)** - OCR
- **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)** - Local data caching
- **[React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)** - Smooth animations

## 🙏 Acknowledgments

- **Data Source**: [sahkonhintatanaan.fi](https://www.sahkonhintatanaan.fi)
- **Framework**: [Expo](https://expo.dev) and [React Native](https://reactnative.dev)
- **AI Tools**: [Warp](https://warp.dev)
