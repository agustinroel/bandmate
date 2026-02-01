# Bandmate Roadmap 2026: The Social Music Platform

> **Vision**: Transform Bandmate from a personal utility into the essential social platform for musicians to connect, form bands, and manage their musical life.

---

## 📱 1. Mobile First Strategy
**Objective**: Presence in Google Play & Apple App Store.
- **Tech Stack**: Integration of **Capacitor** (Ionic) into the existing Angular architecture.
- **Goal**: Shared codebase for Web, Android, and iOS.

## 💰 2. Monetization Model (SaaS)
**Model**: Freemium with Monthly/Annual Subscriptions.

### 🥉 Free Tier (Musician)
*For the casual musician or student.*
- Basic Song Editor (Lyrics + Chords).
- **Chord Playback**: Hear how a chord sounds by tapping it.
- Personal Library (Limited to ~20 songs).
- Basic Tools: Tuner, Metronome.
- Public Musician Profile (Basic info).

### 🥈 Pro Tier (Pro Musician)
*For the growing artist.*
- **Unlimited** Songs & Setlists.
- **Smart Composition Assistant**: AI suggestions for chords and progressions (e.g., "Add tension with G7").
- **Gamification**: Practice streaks, heatmaps, and progress tracking.
- Cloud Sync & Backup across devices.
- Advanced Practice Mode (Loops, Speed Trainer, Audio Detection).
- Advanced Musician Profile (Featured in search, Video/Audio demos).

### 🥇 Band Tier (For Teams)
*For active bands.*
- **Shared Repertoire**: Real-time sync of songs for all members.
- **Live Mode**: Synchronized scrolling for the whole band during shows.
- **Band Calendar**: Rehearsals & Gigs management.
- **Band Profile**: Recruitment tools, "Looking for X" badges.

---

## 🗺️ Phased Execution Plan

### Phase 1: The Cloud Foundation ☁️
*Transition from local-only to cloud-enabled.*
- [ ] **Backend Setup**: NestJS API with PostgreSQL.
- [ ] **Authentication**: Secure Login/Sign-up.
- [ ] **Cloud Sync**: Migrate local IndexedDB data to Backend.
- [ ] **Capacitor Integration**: Validate Android/iOS builds.

### Phase 2: Social Core 🤝
*Identity and Connections.*
- [ ] **User Profiles**: Instruments, Genre preferences, Experience level.
- [ ] **Band Creation**: Create a Band entity.
- [ ] **Member Management**: Invite system (Link/Email) & Roles (Admin/Member).
- [ ] **Shared Workspace**: Switch between Personal View and Band View.

### Phase 3: Discovery & Recruitment 🔍
*Finding the right people.*
- [ ] **Musician Search**: Filter by Instrument, Location (City), Genre.
- [ ] **Band Search**: Filter by "Looking for members".
- [ ] **Applications**: Apply to join a band / Invite musician to audition.
- [ ] **Gig Management Tools**:
    - **Stage Plot Maker**: Drag & drop stage planner.
    - **Tech Rider Generator**: Auto-generate input lists.

### Phase 4: Monetization & Store Launch 🚀
*Going public.*
- [ ] **Payment Integration**: Stripe (Web) + In-App Purchases (Mobile).
- [ ] **EPK Generator**: One-click "Electronic Press Kit" website for bands.
- [ ] **Store Assets**: Screenshots, Descriptions, Privacy Policy.
- [ ] **Launch**: Publish to Play Store & App Store.

---

## 🎨 Design Philosophy Update
- **Vibrant & Premium**: Move towards a high-contrast, stage-ready dark mode.
- **Mobile-First UX**: Optimization for touch targets and one-handed use.
