# 🎬 OffReel — Immersive Offline Video Vault & Feed

[![OffReel Website](https://img.shields.io/badge/Official_Website-offreel.vercel.app-000000?style=for-the-badge&logo=google-chrome&logoColor=white)](https://offreel.vercel.app/)
[![Latest Release](https://img.shields.io/badge/Download_Latest-v1.2.1-34C759?style=for-the-badge&logo=android&logoColor=white)](https://offreel.vercel.app/)
[![Discord Server](https://img.shields.io/badge/Join_Discord-Community-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/5QYH4xaS)

**OffReel** is a beautiful, offline-first mobile app that turns your phone's local video gallery into a dynamic, zero-latency vertical feed. Experience your own personal videos with the same fluid, continuous swipe mechanics as modern social platforms—**with 100% privacy, zero algorithms, and zero ads.**

---

## ✨ Features You'll Love

- **🎬 Vertical Reels-Style Feed:** Swipe up or down to scroll chronologically through your video gallery in a smooth, continuous vertical layout.
- **🔒 Absolute Privacy & 100% Offline:** No accounts, no login, and no internet required. Your private personal videos never leave the glass of your phone.
- **💖 Double-Tap to Favorite:** Love a memory? Quickly double-tap anywhere on the screen to add it to your favorites with a beautiful physical vibration (haptics) and a cinematic heart burst effect.
- **Aspect Ratio Control:** Switch instantly between **Fill Frame (Cover)** to immerse yourself in the action, or **Original View (Contain)** to see the full format. Tap the floating icon on paused videos or change it in settings.
- **🔄 Flexible Synchronization Engines:**
  - *Live OS Gallery (Auto-Sync):* Automatically scan and sync new videos from your device's camera roll seamlessly in the background.
  - *Custom Vault (Manual Mode):* Handpick exactly which videos you want to include in your OffReel feed through a secure grid with built-in selection locks.
- **🍸 Glassmorphic Actions:** A beautiful floating panel at the bottom of the feed lets you instantly favorite items, share videos natively to other apps, or view local file details.
- **💎 High-End Aesthetic Skeletons:** Gorgeous, smooth shimmering screens ensure the app feels premium and alive even when initializing your media vault.

---

## 📲 How to Download & Install (Android)

OffReel is currently distributed as a standalone, zero-bloat Android package (.APK) for maximum control and privacy.

1. **Download the APK:**
   Visit our [Official Landing Page & Release Hub](https://offreel.vercel.app/) or download the latest package directly: **[Download OffReel v1.2.1 APK](https://offreel.vercel.app/downloads/offreel-1.2.1.apk)**.
2. **Allow Unknown Sources:**
   If your phone prompts you about installing applications from "Unknown Sources" or your web browser, tap **Settings** in the prompt and enable **"Allow from this source"**.
3. **Install:**
   Tap the downloaded `.apk` file and tap **Install** in the native Android dialog.
4. **Grant Permissions:**
   Upon launching OffReel, permit the app to access your media files so it can securely populate your offline feed.

---

## 📖 User Manual & Controls

OffReel features highly intuitive gestures and a simple settings hub designed to keep you in complete control:

| Gesture / Action | Action Performed |
| :--- | :--- |
| **Swipe Up / Down** | Seamlessly navigates to the next or previous video in your vault. |
| **Single Tap** | Pauses or resumes playback. While paused, a play icon overlay will appear. |
| **Double Tap** | Favorites the active video, triggering a physical haptic pulse and heart explosion. |
| **Pill Menu (Bottom)** | Tap **Heart** to favorite, **Paper Plane** to share, and **Ellipsis (...)** to view file names. |
| **Gear Icon (Top Right)** | Opens the Vault Settings sheet. |

### Vault Settings Overview
Open settings by tapping the gear icon at the top right of your screen:
*   **Display Ratio:** Set whether videos default to **Fill Frame** or **Original View**.
*   **Sync Engine:** Toggle between **Live OS Gallery** (auto-sync) and **Custom Vault** (manual selection).
*   **Danger Zone:** Click **Reset & Wipe Global Vault** to clear your favorites, reset default ratios, and start fresh.

---

## 🛠 Troubleshooting Common Issues

*   **📺 Video is blank, black, or hanging?**
    Hardware video decoders can occasionally hang on raw device files. Simply open **Settings** (gear icon) and tap **"Refresh Media Bridge"**. This will instantly reset the local media decoders and restore your feed immediately.
*   **🔄 Want to add more manual videos?**
    If you're using **Custom Vault** mode, you'll see a white **+** button under the gear icon on the top right. Tap it to select new videos from your device.
*   **🗑 How do I clear my cache?**
    Open settings, scroll to the bottom, and tap **"Reset & Wipe Global Vault"** to safely purge all stored metadata. Your physical video files in your phone's gallery will **never** be deleted.

---

## 💬 Community

Join our active Discord community to talk with the creator, share your feedback, report issues, and help shape our feature roadmap!

👉 **[Join the OffReel Discord Server](https://discord.gg/5QYH4xaS)**

---

### 💻 For Developers (Optional)
If you are a developer looking to build the application from source code:
1. Clone the repository and install dependencies: `npm install`.
2. Start the local server: `npx expo start`.
3. To trigger standalone APK builds using EAS: `npx eas build --profile preview --platform android`.

---
<p align="center">Developed with ❤️ by <a href="https://github.com/elvisthebuilder">elvisthebuilder</a></p>
