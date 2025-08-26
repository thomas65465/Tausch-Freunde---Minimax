# Pickerl-Sammel-App - Technische Dokumentation

## Übersicht
Die Pickerl-Sammel-App ist eine moderne, vollständig funktionsfähige Web-Anwendung zum Sammeln und Tauschen virtueller Sticker mit Freunden. Sie bietet eine intuitive Benutzeroberfläche, soziale Funktionen und ein robustes Backend.

## 🏗️ Architektur

### Frontend
- **Framework**: React 19 mit TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router DOM 7
- **Styling**: TailwindCSS 3.4 mit custom design system
- **State Management**: React Context API + Hooks
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **UI Components**: Headless UI

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (Magic Link)
- **Edge Functions**: Deno/TypeScript (Supabase Functions)
- **Real-time**: Supabase Realtime (WebSockets)
- **File Storage**: Supabase Storage

### Deployment
- **Frontend**: Statische Bereitstellung
- **Backend**: Serverless (Supabase)
- **CDN**: Global Content Delivery

## 🔧 Supabase-Konfiguration

### Projekt-Details
```
Project URL: https://ufnzoolmkglrbsbeufwu.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbnpvb2xta2dscmJzYmV1Znd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3Njg0MjMsImV4cCI6MjA3MTM0NDQyM30.Jn1dtEvYlNwIvjwhZQhvI4iMXsEWLUQMBA9pc-wYMfU
```

### Edge Functions
1. **friend-request**: Verwaltet Freundschaftsanfragen
2. **trade-suggestions**: Schlägt mögliche Tauschgeschäfte vor
3. **whatsapp-share**: Generiert WhatsApp-Sharing-Links
4. **auth-helper**: Unterstützt erweiterte Authentifizierungsflows

## 🗄️ Datenbankstruktur

### Haupttabellen

#### `users` (Benutzer)
```sql
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT,
    username TEXT UNIQUE,
    avatar_path TEXT,
    friend_code TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `albums` (Sammelaktionen)
```sql
CREATE TABLE albums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    total_stickers INTEGER DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `stickers` (Sticker-Katalog)
```sql
CREATE TABLE stickers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    album_id UUID NOT NULL,
    sticker_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT,
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `user_stickers` (Benutzer-Sammlung)
```sql
CREATE TABLE user_stickers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    sticker_id UUID NOT NULL,
    quantity INTEGER DEFAULT 1,
    collected_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, sticker_id)
);
```

#### `friendships` (Freundschaften)
```sql
CREATE TABLE friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    friend_id UUID NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `trades` (Tauschgeschäfte)
```sql
CREATE TABLE trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID NOT NULL,
    responder_id UUID NOT NULL,
    offered_sticker_id UUID NOT NULL,
    requested_sticker_id UUID NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Relationen
- **users** ↔ **user_stickers**: One-to-Many
- **albums** ↔ **stickers**: One-to-Many  
- **stickers** ↔ **user_stickers**: One-to-Many
- **users** ↔ **friendships**: Many-to-Many (self-referencing)
- **users** ↔ **trades**: Many-to-Many (requester/responder)

## 🔐 Authentifizierung

### Magic Link Setup
- **Provider**: Supabase Auth
- **Flow**: Passwordless mit E-Mail-Verifikation
- **Session-Management**: Enhanced mit localStorage-Caching
- **Persistierung**: 7+ Tage durch optimierte Session-Konfiguration

### Session-Persistierung (Verbessert)
```typescript
// Enhanced session configuration
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`,
    data: {
      remember_me: true
    }
  }
});
```

### Authentifizierungs-Context
- **State Management**: Optimiert für lange Sitzungen
- **Cache-Strategie**: localStorage für Benutzerprofil-Daten
- **Error Handling**: Deutsche Fehlermeldungen mit Übersetzungen
- **Performance**: Lazy Loading von Benutzerdaten

## 🌐 Deployment-Details

### Aktuelle Version
```
Production URL: https://go5upv0bcbo1.space.minimax.io
Deployment-Datum: 2025-08-24
Version: 2.0 (Verbesserte Version)
```

### Build-Prozess
```bash
npm run build    # TypeScript-Kompilierung + Vite-Build
cp -r public/images/avatars_minimal dist/images/  # Assets kopieren
```

### Environment-Variablen (Frontend)
```typescript
// src/lib/supabase.ts
const supabaseUrl = 'https://ufnzoolmkglrbsbeufwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiI...'; // Anonymer Schlüssel
```

### Environment-Variablen (Edge Functions)
```
SUPABASE_URL=https://ufnzoolmkglrbsbeufwu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[Service Role Key]
```

## 🎨 Design System

### Minimalistische Avatare (NEU)
- **Stil**: Flaches, minimalistisches Design
- **Format**: PNG mit Transparenz
- **Auflösung**: Optimiert für Web (verschiedene Größen)
- **Verfügbare Tiere**: 13 minimalistische + 3 klassische Avatare

### Avatar-Katalog
```
/images/avatars_minimal/
├── avatar_fox_minimal.png      # Fuchs (minimalistisch)
├── avatar_cat_minimal.png      # Katze (minimalistisch)
├── avatar_dog_minimal.png      # Hund (minimalistisch)
├── avatar_bear_minimal.png     # Bär (minimalistisch)
├── avatar_elephant_minimal.png # Elefant (minimalistisch)
├── avatar_lion_minimal.png     # Löwe (minimalistisch)
├── avatar_monkey_minimal.png   # Affe (minimalistisch)
├── avatar_owl_minimal.png      # Eule (minimalistisch)
├── avatar_panda_minimal2.png   # Panda (minimalistisch)
├── avatar_penguin_minimal2.png # Pinguin (minimalistisch)
├── avatar_rabbit_minimal2.png  # Hase (minimalistisch)
├── avatar_tiger_minimal.png    # Tiger (minimalistisch)
└── avatar_zebra_minimal.png    # Zebra (minimalistisch)
```

### Farb-Palette
```css
/* Primary Colors */
--primary-50: #eff6ff;
--primary-500: #3b82f6;
--primary-600: #2563eb;

/* Gradients */
.text-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
.bg-gradient-primary: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
```

## 👥 Funktionen

### Kern-Features
- ✅ **Benutzer-Registrierung**: Magic Link Auth mit Avatar-Auswahl
- ✅ **Sticker-Sammlung**: Sticker-Pakete öffnen und sammeln
- ✅ **Freunde-System**: Freunde per Code hinzufügen
- ✅ **Tausch-System**: Sticker zwischen Freunden tauschen
- ✅ **Fortschritts-Tracking**: Detaillierte Sammel-Statistiken
- ✅ **Social Sharing**: WhatsApp-Integration für Fortschritt
- ✅ **Responsive Design**: Optimiert für Desktop und Mobile

### Erweiterte Features
- 🔔 **Benachrichtigungen**: Real-time für Tausch- und Freundschaftsanfragen
- 📊 **Ranglisten**: Freunde nach Sammel-Fortschritt sortiert
- 🎁 **Seltenheits-System**: Common, Uncommon, Rare, Epic, Legendary
- 🏆 **Achievements**: Vervollständigte Alben und Meilensteine
- 🔄 **Auto-Sync**: Automatische Datensynchronisation

## 🚀 Entwickler-Anweisungen

### Lokale Entwicklung
```bash
# Repository klonen
git clone <repository-url>
cd sticker-sammler-app

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Build für Produktion
npm run build

# Linting
npm run lint
```

### Projekt-Struktur
```
sticker-sammler-app/
├── public/
│   ├── images/
│   │   ├── avatars_minimal/     # Minimalistische Avatare
│   │   └── avatars/             # Klassische Avatare
│   └── manifest.json
├── src/
│   ├── components/              # React-Komponenten
│   ├── contexts/               # Context-Provider
│   ├── pages/                  # Seiten-Komponenten
│   ├── lib/                    # Utilities & Supabase-Client
│   └── utils/                  # Helper-Funktionen
├── supabase/
│   ├── functions/              # Edge Functions
│   ├── migrations/             # Datenbank-Migrationen
│   └── tables/                 # Tabellen-Definitionen
└── dist/                       # Build-Output
```

### Testing
```bash
# Lokale Tests
npm run test

# E2E-Tests (nach Deployment)
npm run test:e2e
```

### Debugging
1. **Frontend**: Browser DevTools + React DevTools
2. **Backend**: Supabase Dashboard → Logs
3. **Edge Functions**: `console.log` → Supabase Logs
4. **Database**: Supabase → SQL Editor

## 🔧 Wartung & Updates

### Regelmäßige Aufgaben
- **Dependencies**: Monatliche Updates prüfen
- **Sicherheit**: CVE-Monitoring für npm-Pakete
- **Performance**: Lighthouse-Audits durchführen
- **Backups**: Datenbank-Backups (automatisch via Supabase)

### Monitoring
- **Uptime**: Supabase-Dashboard
- **Performance**: Web Vitals
- **Errors**: Browser-Console + Supabase-Logs
- **Usage**: Supabase Analytics

## 📈 Skalierung & Optimierungen

### Performance-Optimierungen
- **Code Splitting**: Lazy Loading von Seiten
- **Image Optimization**: WebP + Responsive Images
- **Caching**: Service Worker für offline-Funktionalität
- **Bundle Splitting**: Vendor-Code getrennt

### Skalierungs-Strategien
- **Database**: Read Replicas für hohe Last
- **Storage**: CDN für statische Assets
- **Edge Functions**: Auto-Scaling via Supabase
- **Real-time**: Connection Pooling

## 🐛 Bekannte Probleme & Lösungen

### Gelöste Probleme (v2.0)
- ✅ **Session-Persistierung**: Erweiterte Konfiguration implementiert
- ✅ **Avatar-System**: Minimalistische Avatare integriert
- ✅ **Navigation**: Header-Buttons funktional
- ✅ **Freunde-System**: Edge Function debugged

### Zukünftige Verbesserungen
- 🔄 Push-Benachrichtigungen für mobile Geräte
- 🔄 Offline-Modus mit Service Worker
- 🔄 Advanced Trading-Algorithmus
- 🔄 Leaderboards und Seasons

## 📞 Support & Kontakt

### Dokumentation
- **API-Docs**: Supabase Auto-generated Docs
- **Component-Docs**: Inline JSDoc-Kommentare
- **Database-Schema**: ERD im Supabase Dashboard

### Development Team
- **Frontend**: React/TypeScript-Entwicklung
- **Backend**: Supabase/PostgreSQL-Administration
- **Design**: UX/UI-Design und Asset-Erstellung

---

**Version**: 2.0 (Erweiterte Version)  
**Letzte Aktualisierung**: 2025-08-24  
**Status**: Production-Ready ✅