# API-Dokumentation - Pickerl-Sammel-App

## Übersicht
Die Pickerl-Sammel-App nutzt Supabase als Backend-as-a-Service mit PostgreSQL-Datenbank, Authentication, Realtime-Subscriptions und Edge Functions.

## 🔐 Authentifizierung

### Magic Link Authentication
```typescript
// E-Mail Magic Link anfordern
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: { remember_me: true }
  }
});
```

### Session Management
```typescript
// Aktuelle Session abrufen
const { data: { session }, error } = await supabase.auth.getSession();

// Benutzer abmelden
const { error } = await supabase.auth.signOut();

// Auth State Changes lauschen
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    if (event === 'SIGNED_IN') {
      // Benutzer hat sich angemeldet
    }
  }
);
```

## 📊 Datenbank-API

### Benutzer (Users)

#### Profil erstellen
```typescript
const { data, error } = await supabase
  .from('users')
  .insert({
    id: user.id,
    email: user.email,
    username: 'example_user',
    avatar_path: '/images/avatars_minimal/avatar_fox_minimal.png',
    friend_code: 'ABC123'
  })
  .select()
  .single();
```

#### Profil abrufen
```typescript
const { data: userProfile, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .maybeSingle();
```

#### Benutzername-Verfügbarkeit prüfen
```typescript
const { data, error } = await supabase
  .from('users')
  .select('id')
  .eq('username', username)
  .maybeSingle();

const isAvailable = !data; // Verfügbar wenn kein Benutzer gefunden
```

### Alben (Albums)

#### Aktive Alben abrufen
```typescript
const { data: albums, error } = await supabase
  .from('albums')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```

#### Album mit Fortschritt abrufen
```typescript
// Sticker im Album
const { data: stickers, error: stickersError } = await supabase
  .from('stickers')
  .select('id')
  .eq('album_id', albumId);

// Benutzer-Sticker für dieses Album
const { data: userStickers, error: userStickersError } = await supabase
  .from('user_stickers')
  .select('sticker_id')
  .eq('user_id', userId)
  .in('sticker_id', stickerIds);

const progress = (userStickers.length / stickers.length) * 100;
```

### Sticker (Stickers)

#### Sticker zu Sammlung hinzufügen
```typescript
const { data, error } = await supabase
  .from('user_stickers')
  .upsert({
    user_id: userId,
    sticker_id: stickerId,
    quantity: 1
  })
  .select();
```

#### Benutzer-Sticker abrufen
```typescript
const { data: userStickers, error } = await supabase
  .from('user_stickers')
  .select(`
    *,
    sticker:stickers(*)
  `)
  .eq('user_id', userId);
```

### Freundschaften (Friendships)

#### Freunde abrufen
```typescript
const { data: friendships, error } = await supabase
  .from('friendships')
  .select('*')
  .eq('status', 'accepted')
  .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

// Freund-IDs extrahieren
const friendIds = friendships.map(f => 
  f.user_id === userId ? f.friend_id : f.user_id
);

// Freund-Profile abrufen
const { data: friends, error: friendsError } = await supabase
  .from('users')
  .select('*')
  .in('id', friendIds);
```

#### Ausstehende Freundschaftsanfragen
```typescript
const { data: pendingRequests, error } = await supabase
  .from('friendships')
  .select(`
    *,
    requester:users!friendships_user_id_fkey(*)
  `)
  .eq('friend_id', userId)
  .eq('status', 'pending');
```

### Tauschgeschäfte (Trades)

#### Handelsanfrage erstellen
```typescript
const { data, error } = await supabase
  .from('trades')
  .insert({
    requester_id: userId,
    responder_id: friendId,
    offered_sticker_id: offeredStickerId,
    requested_sticker_id: requestedStickerId,
    status: 'pending'
  })
  .select()
  .single();
```

#### Ausstehende Handelsanfragen
```typescript
const { data: pendingTrades, error } = await supabase
  .from('trades')
  .select(`
    *,
    requester:users!trades_requester_id_fkey(*),
    offered_sticker:stickers!trades_offered_sticker_id_fkey(*),
    requested_sticker:stickers!trades_requested_sticker_id_fkey(*)
  `)
  .eq('responder_id', userId)
  .eq('status', 'pending');
```

## ⚡ Edge Functions

### Friend Request Function

#### Freundschaftsanfrage senden
```typescript
const { data, error } = await supabase.functions.invoke('friend-request', {
  body: {
    friendCode: 'ABC123',
    action: 'request'
  }
});
```

**Response Format:**
```typescript
{
  data: {
    friendship: {
      id: string,
      user_id: string,
      friend_id: string,
      status: 'pending',
      created_at: string
    },
    friend: {
      id: string,
      username: string,
      avatar_path: string
    }
  }
}
```

### WhatsApp Share Function

#### Fortschritt teilen
```typescript
const { data, error } = await supabase.functions.invoke('whatsapp-share', {
  body: {
    type: 'progress',
    data: {
      totalStickers: 150,
      collectedStickers: 120,
      completedAlbums: 2
    }
  }
});

// Response enthält WhatsApp-URL
window.open(data.data.whatsappUrl, '_blank');
```

### Trade Suggestions Function

#### Tausch-Vorschläge abrufen
```typescript
const { data, error } = await supabase.functions.invoke('trade-suggestions', {
  body: {
    friendId: 'friend-uuid'
  }
});
```

## 🔄 Real-time Subscriptions

### Freundschaftsanfragen lauschen
```typescript
const friendshipSubscription = supabase
  .channel('friendships')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'friendships',
      filter: `friend_id=eq.${userId}`
    },
    (payload) => {
      // Neue Freundschaftsanfrage erhalten
      console.log('New friend request:', payload.new);
    }
  )
  .subscribe();
```

### Handelsanfragen lauschen
```typescript
const tradesSubscription = supabase
  .channel('trades')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'trades',
      filter: `or(requester_id.eq.${userId},responder_id.eq.${userId})`
    },
    (payload) => {
      // Handelsanfrage geändert
      console.log('Trade update:', payload);
    }
  )
  .subscribe();
```

## 🛡️ Row Level Security (RLS)

### Richtlinien-Übersicht

#### Users Table
- **SELECT**: Eigenes Profil + öffentliche Informationen anderer
- **INSERT/UPDATE**: Nur eigenes Profil
- **DELETE**: Nicht erlaubt

#### User Stickers Table
- **SELECT**: Eigene Sticker + Freunde-Sticker (bei akzeptierter Freundschaft)
- **INSERT/UPDATE/DELETE**: Nur eigene Sticker

#### Friendships Table
- **SELECT**: Freundschaften in denen man beteiligt ist
- **INSERT**: Freundschaftsanfragen senden (als requester)
- **UPDATE**: Status ändern wenn beteiligt
- **DELETE**: Eigene Anfragen löschen

#### Trades Table
- **SELECT**: Eigene Handelsgeschäfte
- **INSERT**: Handelsanfragen erstellen (als requester)
- **UPDATE**: Status ändern wenn beteiligt
- **DELETE**: Eigene Anfragen löschen

## 📱 Client-Side Implementation

### Supabase Client Setup
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Error Handling
```typescript
try {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Database error:', error);
    toast.error('Fehler beim Laden der Daten');
    return;
  }

  // Daten verwenden
  setUserProfile(data);
} catch (exception) {
  console.error('Unexpected error:', exception);
  toast.error('Ein unerwarteter Fehler ist aufgetreten');
}
```

### TypeScript-Typen
```typescript
// Database Types
interface User {
  id: string;
  email: string;
  username: string;
  avatar_path: string;
  friend_code: string;
  created_at: string;
  updated_at: string;
}

interface Album {
  id: string;
  name: string;
  description: string;
  total_stickers: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

interface Sticker {
  id: string;
  album_id: string;
  sticker_number: number;
  name: string;
  image_url: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  created_at: string;
}
```

## 🔧 Development Utilities

### Debug Queries
```typescript
// Query mit Debug-Information
const { data, error, status, statusText } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);

console.log('Query status:', status, statusText);
console.log('Data:', data);
console.log('Error:', error);
```

### Performance Monitoring
```typescript
// Query-Zeit messen
const startTime = performance.now();
const { data, error } = await supabase
  .from('user_stickers')
  .select('*')
  .eq('user_id', userId);
const endTime = performance.now();

console.log(`Query took ${endTime - startTime} milliseconds`);
```

---

**📚 Weitere Informationen**: [Supabase Documentation](https://supabase.com/docs)  
**🏠 Zurück zur Hauptdokumentation**: [README.md](../README.md)