# 🎯 Pickerl-Sammel-App

Eine moderne, vollständig funktionsfähige Web-Anwendung zum Sammeln und Tauschen virtueller Sticker mit Freunden.

## 🌟 Features

### ✅ Kern-Funktionen
- **Magic Link Authentifizierung** - Sichere, passwortlose Anmeldung
- **Avatar-System** - 16 minimalistische Tier-Avatare zur Auswahl
- **Sticker-Sammlung** - Sticker-Pakete öffnen und seltene Sticker finden
- **Freunde-System** - Freunde per eindeutigem Code hinzufügen
- **Tausch-System** - Sticker zwischen Freunden tauschen
- **Fortschritts-Tracking** - Detaillierte Sammel-Statistiken und Ranglisten
- **Social Sharing** - Fortschritt über WhatsApp teilen
- **Responsive Design** - Optimiert für Desktop und Mobile

### 🚀 Technische Highlights
- **Session-Persistierung** - Lange Sitzungen ohne häufige Re-Logins
- **Real-time Updates** - Live-Benachrichtigungen für Tausch-/Freundschaftsanfragen
- **Offline-Ready** - Optimierte Performance auch bei schlechter Verbindung
- **Modern Stack** - React 19, TypeScript, TailwindCSS, Supabase

## 🎮 Live Demo

**🌐 Aktuelle Version**: [https://go5upv0bcbo1.space.minimax.io](https://go5upv0bcbo1.space.minimax.io)

### Test-Accounts
Erstellen Sie einfach ein neues Konto mit Ihrer E-Mail-Adresse oder nutzen Sie die Test-Account-Funktion!

## 🏗️ Technischer Stack

### Frontend
- **React 19** mit TypeScript
- **Vite 7** als Build-Tool
- **TailwindCSS** für modernes Styling
- **React Router** für Client-Side Routing
- **Lucide React** für Icons

### Backend
- **Supabase** (PostgreSQL + Auth + Realtime)
- **Edge Functions** für Geschäftslogik
- **Supabase Storage** für Asset-Management
- **Row Level Security** für Datenschutz

## 🚀 Installation & Setup

### Voraussetzungen
- Node.js 18+ (empfohlen: 20+)
- npm oder yarn
- Ein Supabase-Projekt (kostenlos)

### Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/your-repo/sticker-sammler-app.git
cd sticker-sammler-app

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Build für Produktion
npm run build
```

### Supabase Setup

1. **Projekt erstellen**: Neues Projekt auf [supabase.com](https://supabase.com)
2. **Datenbank setup**: SQL-Dateien aus `/supabase/tables/` ausführen
3. **Edge Functions deployen**: Funktionen aus `/supabase/functions/`
4. **Konfiguration**: `.env` anhand von `.env.example` mit Ihren Keys anlegen

### Environment-Variablen

```javascript
// src/lib/supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

```bash
# .env
VITE_SUPABASE_URL=https://ufnzoolmkglrbsbeufwu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbnpvb2xta2dscmJzYmV1Znd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3Njg0MjMsImV4cCI6MjA3MTM0NDQyM30.Jn1dtEvYlNwIvjwhZQhvI4iMXsEWLUQMBA9pc-wYMfU
```

## 📱 Screenshots

### Hauptfunktionen
- 🏠 **Dashboard**: Übersicht über Sammlung und Fortschritt
- 👤 **Onboarding**: Intuitive Avatar-Auswahl und Registrierung
- 📦 **Sticker-Pakete**: Spannende Pack-Öffnungen mit Animations
- 👥 **Freunde**: Ranglisten und Freundschafts-Management
- 🔄 **Trading**: Einfacher Sticker-Tausch zwischen Freunden

## 🎨 Design-System

### Minimalistische Avatare
Die App verwendet 13 speziell designte, minimalistische Tier-Avatare:
- Fuchs, Katze, Hund, Bär, Elefant
- Löwe, Affe, Eule, Panda, Pinguin
- Hase, Tiger, Zebra + weitere

### Farb-Palette
- **Primary**: Blaue Töne für Hauptaktionen
- **Gradients**: Moderne Farbverläufe für visuelles Interesse
- **Semantic**: Grün für Erfolg, Rot für Errors, Gelb für Warnungen

## 📚 API-Dokumentation

Detaillierte technische Dokumentation finden Sie in der [TECH_STACK.md](./TECH_STACK.md).

### Wichtige Komponenten

#### Authentication Context
```typescript
const { user, userProfile, sendMagicLink, signOut } = useAuth();
```

#### Supabase Client
```typescript
import { supabase } from './lib/supabase';
```

## 🔧 Entwicklung

### Projekt-Struktur
```
src/
├── components/     # Wiederverwendbare UI-Komponenten
├── contexts/       # React Context Provider
├── pages/         # Seiten-Komponenten
├── lib/           # Utilities & Supabase-Client
└── utils/         # Helper-Funktionen
```

### Wichtige Scripts
```bash
npm run dev        # Entwicklungsserver
npm run build      # Produktions-Build
npm run lint       # Code-Linting
npm run type-check # TypeScript-Prüfung
```

## 🚀 Deployment

### Automatisches Deployment
Die App ist für statisches Hosting optimiert und kann auf verschiedenen Plattformen deployed werden:

- **Vercel** (empfohlen)
- **Netlify**
- **GitHub Pages**
- **Firebase Hosting**

### Build-Prozess
1. TypeScript-Kompilierung
2. Asset-Optimierung
3. Code-Splitting für optimale Performance
4. Service Worker für Offline-Unterstützung

## 🧪 Testing

### Test-Strategien
- **Unit Tests**: Komponenten-Tests mit React Testing Library
- **Integration Tests**: API-Interaktionen mit Supabase
- **E2E Tests**: Komplette User-Journeys

```bash
npm run test       # Unit Tests
npm run test:e2e   # End-to-End Tests
```

## 🐛 Bekannte Probleme & Lösungen

### v2.0 Verbesserungen
- ✅ Session-Persistierung optimiert (7+ Tage ohne Re-Login)
- ✅ Neue minimalistische Avatare integriert
- ✅ Navigation vollständig funktional
- ✅ Freunde-System debugged und verbessert

### Zukünftige Features
- 🔄 Push-Benachrichtigungen
- 🔄 Erweiterte Trading-Algorithmen
- 🔄 Leaderboards und Seasons
- 🔄 Mehr Sticker-Kategorien

## 🤝 Contributing

### Beiträge sind willkommen!
1. Fork das Repository
2. Feature-Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Änderungen committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request öffnen

### Code-Standards
- TypeScript für Typsicherheit
- ESLint + Prettier für Code-Formatierung
- Conventional Commits für konsistente Commit-Messages
- Komponenten-Tests für neue Features

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Details finden Sie in der [LICENSE](./LICENSE)-Datei.

## 🙏 Credits

### Technologien
- **React Team** für das großartige React-Framework
- **Supabase** für die Backend-as-a-Service-Plattform
- **TailwindCSS** für das utility-first CSS-Framework
- **Lucide** für die wunderschönen Icons

### Design
- Minimalistische Avatar-Designs
- Moderne UI/UX-Patterns
- Responsive Design-Prinzipien

---

**🎯 Version**: 2.0 (Erweiterte Version)  
**📅 Letzte Aktualisierung**: 2025-08-24  
**🚀 Status**: Production-Ready ✅

**⭐ Gefällt Ihnen die App? Geben Sie uns einen Stern auf GitHub!**