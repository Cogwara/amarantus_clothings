# Amarantus Clothings - Mobile App (iOS & Android)

Native mobile application built with **React Native** and **Expo (SDK 57)** for Amarantus Clothings thrift store management. Communicates in real time with the Amarantus Clothings backend API.

---

## 📱 Features

- **Dashboard Screen:** Live revenue figures, transactions count, profit estimate, low stock banner, and quick actions.
- **Sell (POS) Screen:** Fast point-of-sale checkout, live product catalog, category filters, item search, quantity controls, payment method selection (Cash, Transfer, POS card), customer notes, and receipt modal.
- **Inventory Screen:** Full product catalog with stock status indicators (In Stock, Low Stock, Sold Out), size/condition details, and tap-to-adjust stock counter modal.
- **Thursday Plan Screen:** Market procurement planner, estimated procurement budget, recommended buy quantities per garment category, and interactive procurement checklist.
- **Expenses Screen:** Record store and market expenses (transport/logistics, rent, electricity, nylon bags, food) with instant totals.
- **Settings Screen:** User profile, shop location details (*Plot 78 Gbazango Kubwa FCT*), server connection switcher (Vercel cloud vs. local network IP), and connection ping tester.

---

## 🚀 How to Run the Mobile App

### 1. Start the Expo Dev Server

From the `mobile/` folder:

```bash
cd mobile
npm start
```

This will launch Metro bundler and display an interactive QR code in your terminal.

---

### 2. Open on Your Phone

#### Android
1. Install **Expo Go** from Google Play Store.
2. Open Expo Go and tap **Scan QR code**.
3. Scan the QR code in your terminal.

#### iPhone / iOS
1. Install **Expo Go** from the Apple App Store.
2. Open the default iOS **Camera** app.
3. Scan the QR code in your terminal and tap **Open in Expo Go**.

---

### 3. Login Credentials

- **Email:** `amarantus@gmail.com`
- **Password:** `Amarantus@123`
*(A quick-fill button is also provided on the login screen for 1-tap entry).*

---

### 4. Switching Servers (Local vs Production)

- **Default Cloud Server:** `https://amarantus-clothings.vercel.app` (connected to Neon PostgreSQL).
- **Local Dev Server:** If testing with your computer running locally on your Wi-Fi, tap the **Server** link on the login screen or in Settings and enter:
  `http://<YOUR_COMPUTER_IP>:3001`

---

## 📦 Building a Standalone APK for Android

To generate a standalone `.apk` for direct installation on Android phones without Expo Go:

```bash
cd mobile
npx eas build -p android --profile preview
```
