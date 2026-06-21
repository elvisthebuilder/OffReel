# 🤝 Contributing to OffReel

Thank you for your interest in contributing to OffReel! We welcome bug reports, feature suggestions, and pull requests. Please take a few minutes to read this guide before you start — it'll make the process smoother for everyone.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Code Quality Standards](#code-quality-standards)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Project Architecture](#project-architecture)
- [Key Conventions & Gotchas](#key-conventions--gotchas)

---

## 🛡 Code of Conduct

Be kind, respectful, and constructive. We don't tolerate harassment in any form. Contributions that violate this will be removed and the contributor blocked.

---

## 🙋 How to Contribute

### Reporting a Bug

1. Search [existing issues](https://github.com/elvisthebuilder/OffReel/issues) first to avoid duplicates.
2. Open a new issue using the **Bug Report** template.
3. Include: device model, Android version, OffReel version, and clear reproduction steps.

### Suggesting a Feature

1. Open an issue using the **Feature Request** template.
2. Describe the problem it solves, not just the solution.
3. Keep the scope focused — smaller proposals are easier to discuss and merge.

### Submitting Code

See the [Pull Request Process](#pull-request-process) section below.

---

## ⚙️ Development Setup

### Prerequisites

| Tool                       | Minimum Version                   |
| :------------------------- | :-------------------------------- |
| Node.js                    | 18.x                              |
| pnpm                       | 8.x                               |
| Expo CLI                   | Latest via `pnpm dlx`             |
| EAS CLI                    | Latest (`pnpm add -g eas-cli`)    |
| Android device or emulator | API 26+ (Android 8.0+)            |

### Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/elvisthebuilder/OffReel.git
cd OffReel

# 2. Install dependencies
pnpm install

# 3. Start the local Expo development server
pnpm start

# 4. Scan the QR code with Expo Go (Android) or press 'a' for an emulator
```

### Building a Preview APK

```bash
# Requires EAS CLI and a logged-in Expo account
pnpm exec eas build --profile preview --platform android
```

---

## 🧹 Code Quality Standards

OffReel uses **ESLint v8** and **Prettier** to enforce consistent, bug-resistant code. All contributions **must** pass the linter before a PR will be reviewed.

### Run Before Every Commit

```bash
# 1. Format your code
pnpm format

# 2. Check for lint violations
pnpm lint

# 3. Auto-fix what can be fixed automatically
pnpm exec eslint . --fix
```

### Key Rules

| Rule                                       | Why                                              |
| :----------------------------------------- | :----------------------------------------------- |
| No unused imports or variables             | Dead code hides real bugs                        |
| `react-hooks/exhaustive-deps`              | Missing deps cause stale closure bugs at runtime |
| Import ordering (third-party before local) | Consistent, readable file headers                |
| No duplicate imports                       | Avoids ambiguous module resolution               |
| Prettier formatting                        | Single canonical style, no arguments             |

### Intentional `eslint-disable` Comments

In some `useEffect` hooks, stable `Animated` refs (e.g. `videoOpacity`, `posterOpacity`) are excluded from the dependency array. This is **intentional** — `useRef` values never change identity, so including them would cause unnecessary re-runs. These suppressions always include an explanatory comment:

```js
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [isPlayerReady]); // posterOpacity is a stable Animated ref
```

Do **not** remove these comments or "fix" the deps array without understanding this pattern first.

---

## ✍️ Commit Message Convention

We follow the **Conventional Commits** standard. Every commit message must follow this format:

```
<type>(<scope>): <short description>
```

### Types

| Type       | When to use                                     |
| :--------- | :---------------------------------------------- |
| `feat`     | A new user-facing feature                       |
| `fix`      | A bug fix                                       |
| `refactor` | Code restructuring with no behavior change      |
| `chore`    | Tooling, config, or dependency updates          |
| `docs`     | Documentation only changes                      |
| `style`    | Formatting or whitespace only (no logic change) |
| `perf`     | Performance improvements                        |

### Examples

```
feat(feed): add resume-from-last-position on app launch
fix(sharing): resolve content:// URI rejection on Android 13+
chore(lint): add ESLint and Prettier configuration
docs(readme): add code quality tooling section
```

---

## 🔄 Pull Request Process

1. **Fork** the repo and create your branch from `main`:
   ```bash
   git checkout -b fix/your-bug-description
   ```
2. **Make your changes** — keep commits small and focused.
3. **Run the linter** — `pnpm lint` must exit with **0 errors**.
4. **Run the formatter** — `pnpm format` to ensure consistent style.
5. **Test on a real device** — OffReel is a native media app; emulators may not expose the same media permission behaviours.
6. **Open a PR** against the `main` branch with:
   - A clear title following the commit convention.
   - A description of _what_ changed and _why_.
   - Screenshots or screen recordings for UI changes.
7. Address any review feedback and keep the PR up to date with `main`.

> PRs that do not pass `pnpm lint` (0 errors) will not be reviewed.

---

## 🏗 Project Architecture

```
OffReel/
├── App.js                    # Root entry — font loading, SafeAreaProvider
├── src/
│   ├── screens/
│   │   └── HomeScreen.js     # Main screen: mode selection, vault picker, settings
│   ├── hooks/
│   │   └── useVideos.js      # Core logic: vault sync, gallery scanning, state
│   └── components/
│       ├── VideoFeed.js      # FlatList-based vertical reel player
│       ├── VideoItem.js      # Individual video card with hardware decoder
│       ├── FloatingPill.js   # Floating action bar (favorite, share, details)
│       └── VaultSkeleton.js  # Shimmer loading screen
├── .eslintrc.js              # ESLint configuration
├── .prettierrc               # Prettier configuration
├── .eslintignore             # Files excluded from linting
├── app.json                  # Expo app config (version, permissions, etc.)
└── eas.json                  # EAS build profiles
```

### Data Flow

```
useVideos (hook)
  └── Manages: videos[], loading, appMode, defaultFit, initialVideoId
        ↓
HomeScreen (screen)
  └── Renders: mode picker, settings sheet, or VideoFeed
        ↓
VideoFeed (component)
  └── FlatList of VideoItem + FloatingPill overlay
        ↓
VideoItem (component)
  └── ActiveVideoItem (expo-video player) + VideoThumbnail (poster)
```

### Storage Keys (AsyncStorage)

| Key                      | Value                                |
| :----------------------- | :----------------------------------- |
| `@offreel_app_mode`      | `'auto'` or `'manual'`               |
| `@offreel_vault_videos`  | JSON array of video asset objects    |
| `@offreel_default_fit`   | `'cover'` or `'contain'`             |
| `@offreel_last_video_id` | Asset ID string for resume-on-launch |

---

## ⚠️ Key Conventions & Gotchas

- **MediaLibrary constants** — Always use `MediaLibrary.MediaType.video` and `MediaLibrary.SortBy.creationTime` (not plain strings like `'video'`). Android silently rejects plain strings.
- **Sharing URIs** — Always resolve `localUri` via `MediaLibrary.getAssetInfoAsync()` before calling `Sharing.shareAsync()`. Raw `content://` URIs are rejected by Android's share sheet.
- **One hardware decoder** — `VideoItem` only mounts the `ActiveVideoItem` (and its `expo-video` player) when `isActive === true`. Never render multiple active players simultaneously — this causes decoder exhaustion and crashes.
- **`initialScrollIndex`** — Calculated via `useMemo` before the FlatList mounts to avoid the index-0 flash on resume. Do not move this to a `useEffect`.
- **`isReadyForSaving`** — There is a 1-second grace period after mount before position saving kicks in. This prevents overwriting the resume position with `0` during the initial scroll-to-index animation.

---

<p align="center">Questions? Join us on <a href="https://discord.gg/5QYH4xaS">Discord</a> 👋</p>
