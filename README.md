# 🎸 Bandmate

**Bandmate** is evolving from a personal tool into a **Social Music Platform**.

It aims to become the essential ecosystem for:
1. **Musicians**: To practice, manage their library, and find other musicians.
2. **Bands**: To manage repertoires, setlists, and rehearsals collaboratively.

> 🚀 **See the future**: check out our [2026 Roadmap](docs/ROADMAP_2026.md) for details on Mobile Apps, Social Features, and Monetization.

---

## 🧠 Project Philosophy

Bandmate connects the entire lifecycle of a musician:
**Independent Practice → Finding a Band → Rehearsing → Live Performance**

The goal is to provide professional tools while facilitating the social connections that keep music alive.

---

## 🎯 Problems Bandmate Solves

- **Disconnected Tools**: Tuners app, sheet music app, messaging app for band logistics. Bandmate unifies them.
- **Finding Musicians**: Hard to find people with compatible tastes and levels nearby.
- **Rehearsal Chaos**: "Wait, which version of the chorus are we doing?" (Solved by Shared Repertoire).
- **Paper & PDF Mess**: Interactive, transposable songs instead of static files.

---

## ✨ Key Features (Current & Planned)

### 🎵 For You (Personal)
- Robust Song Editor (Lyrics + Chords)
- Practice Mode with Auto-Scroll
- Cloud Sync (Planned)

### 🤝 For Your Band (Planned)
- Shared Repertoires in Real-Time
- Role management & Invites
- Band Profiles

### 🌍 For the Community (Planned)
- **Musician Finder**: Find a drummer/bassist near you.
- **Band Finder**: Find bands looking for members.

---

## ⚙️ Technical Overview

## 🏗️ General Architecture

Bandmate is a **Cross-Platform Application** (Web + Mobile), built with:

- Predictable state management
- Reactive UI
- Maintainable code
- Future scalability

---

## 🧱 Tech Stack

### Frontend

- **Angular** (standalone components)
- **Signals** for reactive state
- **Angular Material** as the UI foundation
- Global SCSS + component-level styles
- Feature-based architecture

### State Management

- Signal-based stores
- Clear separation between:
  - State
  - Side effects
  - UI

### Persistence

- Automatic local persistence
- No explicit “save” actions
- Designed to migrate to backend storage seamlessly

---

## 📁 Project Structure (Simplified)

src/
├─ app/
│ ├─ core/ # services, layout, navigation
│ ├─ shared/ # reusable UI, utilities
│ ├─ features/
│ │ ├─ songs/
│ │ ├─ setlists/
│ │ ├─ practice/
│ └─ state/ # global stores
├─ assets/
└─ styles/

---

## 🧠 Technical Principles

- **Standalone-first**
- **Signals over RxJS** where appropriate
- **Reactive, not imperative UI**
- Small, focused, predictable components
- Minimal logic in templates
- Always optimize for:
  - readability
  - maintainability
  - scalability

---

## 🧪 Testing (Planned)

- Unit testing with Jest
- Priority on:
  - state logic
  - helpers
  - stores

---

## 🔐 Authentication (Planned)

- JWT-based authentication
- HTTP interceptors
- Route guards per feature
- Role-based access (user / band)

---

## 🚀 Useful Scripts

# install dependencies

npm install

# start development server

npm start

# production build

npm run build

# rebuild shared package

npm run build -w @bandmate/shared

## 📝 Final Notes

This README is a living document.

As the project evolves, this file should evolve with it:

New features should be reflected here

The original vision should remain clear

Product and technical decisions should stay aligned

Bandmate is built with intention, patience, and care — just like music.
