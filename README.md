# ForJapu

Live Demo (Vercel): `Add your Vercel link here after deploy`

GitHub Repository: [khinphyucinhtet/forjapu](https://github.com/khinphyucinhtet/forjapu)

## About

ForJapu is a personalized reminder and care web app made for two users.  
It is designed as a cute shared space where one user can create reminders, monitor progress, and send whiteboard updates, while the other user can receive reminders, check history, and stay on track in a soft and simple interface.

The app is meant to feel supportive and personal, not like a strict productivity tool.

## User Flow

### Public flow

- App opens with a splash screen.
- If user is already logged in, splash goes straight to that user's home page.
- If user is logged out, splash goes to the login page.
- New users can register with username, email, password, confirm password, and role selection.

### Pinky flow

- Pinky is the sender / manager side.
- Pinky can create, edit, delete, and enable reminders.
- Pinky can use the whiteboard to draw, type text, change colors, and place stickers.
- Pinky can send the whiteboard update so Japu can see it.
- Pinky can view monitoring dashboard data such as total reminders, active reminders, recent logs, and 7-day progress.
- Pinky can update profile details and app settings.

### Japu flow

- Japu is the receiver side.
- Japu can view the next reminder and mark reminders as taken.
- Japu can check reminder history and dashboard-style progress summaries.
- Japu can open the shared whiteboard and see the latest board surprise.
- Japu can update profile details and personal settings.

## Main Features

- Role-based experience for two users
- Login and registration flow
- Firebase-ready authentication
- Shared reminders between both users
- Reminder history tracking
- 7-day dashboard and progress monitoring
- Shared live whiteboard
- Drawing, text, colors, and sticker packs
- Notification permission support
- Profile editing
- Responsive mobile-style UI
- Vercel and Netlify hosting support

## Whiteboard Features

- Free drawing
- Multiple brush thickness sizes
- Multiple text sizes
- Color picker
- Many grouped sticker packs
- Undo
- Clear
- Save
- Send

## Monitoring / Dashboard Features

- Total reminder count
- Active reminder count
- 7-day completed vs ignored summary
- Donut chart overview
- Daily progress bars
- Recent reminder logs

## Tech Stack

### Frontend

- React 19
- React Router DOM
- Vite
- CSS

### Backend / Data

- Firebase Authentication
- Firebase Firestore
- Local demo fallback storage when Firebase env values are not connected

### Hosting

- Vercel
- Netlify

## Project Structure

- `src/pages` : app screens
- `src/components` : reusable UI components
- `src/utils` : Firebase setup, storage logic, dashboard helpers, notifications
- `public` : manifest, service worker, icons

## Firebase Setup

Create a `.env.local` file and add:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

When Firebase env values are connected:

- authentication uses Firebase Auth
- shared app data sync uses Firestore
- both users can use the hosted app with shared updates

If Firebase is not connected, the app falls back to demo mode locally.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Hosting Notes

- `vercel.json` is included for SPA rewrites
- `netlify.toml` is included for deployment support
- after deploying to Vercel, replace the placeholder at the top of this README with your live link

## Notes

- Notifications depend on browser permission on each device.
- Settings are stored per role so Pinky and Japu do not overwrite each other.
- The app is designed to work across different screen sizes with a mobile-friendly layout.
