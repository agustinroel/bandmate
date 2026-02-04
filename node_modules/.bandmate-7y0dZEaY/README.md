# 🎸 Bandmate

**Bandmate** is an application built by musicians, for musicians.

It was born from a simple but persistent problem: keeping songs, lyrics, chords, practices, and rehearsals organized in a single place — without friction, without scattered notes, and without breaking focus.

Bandmate aims to become an **essential tool in a musician’s daily life**, whether you’re practicing alone at home, rehearsing with your band, or preparing a setlist for a live show.

---

## 🧠 Project Philosophy

Bandmate is not just a song manager.

It is designed to:

- Reduce friction between **idea → practice → performance**
- Support amateur and semi-professional musicians alike
- Be fast, clear, and enjoyable to use
- Prioritize **flow and focus** while playing music

The goal is simple:  
When you open Bandmate, **you shouldn’t think about the app — you should think about the music**.

---

## 🎯 Problems Bandmate Solves

- Lyrics and chords scattered across WhatsApp, notes, PDFs, or websites
- Inconsistent versions of songs between band members
- Messy or improvised setlists
- Tools that are not designed for real rehearsal workflows
- Overly complex or generic music apps

---

## ✨ What Bandmate Offers Today

### 🎵 Songs

- Create and edit songs with lyrics and chords
- Key musical metadata:
  - Key / tonality
  - Artist
  - Last updated date
- Clean, readable song view
- Automatic persistence (no manual “save” actions)

### 📋 Setlists

- Create and manage setlists
- Designed for rehearsals and live shows
- Reorder and reuse easily

### 🎧 Practice

- Dedicated practice flow
- Fast access: open → play → close
- No unnecessary distractions

---

## 🚧 Current Focus

Bandmate is currently in an **active MVP phase**, focused on building a solid and scalable foundation before expanding further.

Upcoming key milestones:

- Auto-scroll for lyrics/chords (configurable speed)
- Advanced song filters (artist, key, genre, etc.)
- Authentication (JWT, guards, interceptors)
- Dedicated backend
- Social features:
  - Create bands
  - Share songs and setlists
  - Collaborate with band members
- Spotify integration (reference-based, not a replacement)

---

## 🧩 Long-Term Vision

Bandmate aims to be:

> “The app you open before picking up your instrument.”

A tool that is:

- Social
- Collaborative
- Musically aware
- Carefully crafted with attention to detail

---

# ⚙️ Technical Overview

## 🏗️ General Architecture

Bandmate is built as a modern **Single Page Application**, with a strong focus on:

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
