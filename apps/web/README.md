# Bandmate 🎸

Bandmate is a rehearsal-focused web app for bands and musicians.

It helps you prepare setlists, organize song order, and keep track of total duration — **before you even start playing**.

The goal is simple:  
less time deciding what to play next, more time actually playing.

---

## Why Bandmate?

In many rehearsals, a surprising amount of time is lost on:

- deciding which song comes next
- checking if the set will fit the available time
- reorganizing the order on the fly

Bandmate was designed to solve exactly that.

You prepare your songs and setlists beforehand, and during rehearsal you already know:

- what comes next
- how long the set will last
- how the flow is structured

It’s meant to be **practical, calm, and musician-friendly**.

---

## What you can do

### 🎵 Songs

- Create, edit and delete songs
- Store basic musical info (key, BPM, duration, notes, links)

### 📋 Setlists

- Create multiple setlists
- Add and remove songs
- Reorder songs with drag & drop
- Prevent duplicate songs inside a setlist
- See total setlist duration calculated automatically
- Visual feedback when reordering

### 🎯 UX details

- Selected setlist is persisted between reloads
- Clear empty states and contextual messages
- Confirm dialogs for destructive actions
- Designed to “breathe”: spacing, hierarchy and readability matter

---

## Tech stack

Bandmate is also meant to be a **clean Angular reference project**.

### Frontend

- Angular 21
- Standalone components
- Signals for state management
- Signal Forms
- New control flow syntax (`@if`, `@for`)
- Angular Material + light Bootstrap utilities
- SSR-safe patterns (browser-only APIs guarded)

### Backend

- Fastify
- Simple REST API
- In-memory persistence (for now)
- Clean route separation (songs / setlists)

### Monorepo structure

apps/
├─ web/ # Angular application
└─ api/ # Fastify server
packages/
└─ shared/ # Shared types (DTOs, models)

---

## Getting started

### Requirements

- Node.js (NVM recommended)
- npm (workspaces enabled)

### Install dependencies

npm install

Run locally (development)

In one terminal:

npm run dev:api

In another terminal:

npm run dev:web

Then open:

http://localhost:4200

(The web app uses a development proxy to connect to the local API.)
