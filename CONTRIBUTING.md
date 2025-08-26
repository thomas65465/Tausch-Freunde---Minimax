# Beitrag zur Pickerl-Sammel-App

Vielen Dank für Ihr Interesse, zur Pickerl-Sammel-App beizutragen! 🎉

## 🤝 Wie Sie beitragen können

### Bug Reports 🐛
Wenn Sie einen Fehler gefunden haben:
1. Überprüfen Sie, ob das Problem bereits in den [Issues](https://github.com/your-repo/issues) gemeldet wurde
2. Erstellen Sie ein neues Issue mit:
   - Detaillierter Beschreibung des Problems
   - Schritten zur Reproduktion
   - Erwartetes vs. tatsächliches Verhalten
   - Screenshots (falls hilfreich)
   - Browser/Gerät-Informationen

### Feature Requests ✨
Für neue Funktionswünsche:
1. Prüfen Sie bestehende Feature Requests
2. Erstellen Sie ein Issue mit:
   - Klarer Beschreibung der gewünschten Funktion
   - Begründung, warum diese Funktion nützlich wäre
   - Mögliche Implementierungsansätze

### Code-Beiträge 💻

#### Entwicklungsumgebung einrichten
```bash
# Repository forken und klonen
git clone https://github.com/your-username/sticker-sammler-app.git
cd sticker-sammler-app

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev
```

#### Pull Request-Prozess
1. **Feature Branch erstellen**:
   ```bash
   git checkout -b feature/amazing-new-feature
   ```

2. **Änderungen implementieren**:
   - Code schreiben
   - Tests hinzufügen (falls zutreffend)
   - Dokumentation aktualisieren

3. **Code-Qualität prüfen**:
   ```bash
   npm run lint        # ESLint prüfen
   npm run type-check  # TypeScript prüfen
   npm run test        # Tests ausführen
   ```

4. **Commits erstellen**:
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   ```

5. **Push und Pull Request**:
   ```bash
   git push origin feature/amazing-new-feature
   ```
   Dann über GitHub einen Pull Request erstellen.

## 📜 Code-Standards

### Commit-Messages
Wir verwenden [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(auth): add magic link authentication
fix(ui): resolve avatar selection bug
docs(readme): update installation instructions
style(components): improve button styling
refactor(api): optimize database queries
test(auth): add authentication tests
```

**Types:**
- `feat`: Neue Funktion
- `fix`: Fehlerbehebung
- `docs`: Dokumentation
- `style`: Code-Formatierung
- `refactor`: Code-Umstrukturierung
- `test`: Tests
- `chore`: Build/Dependency-Updates

### Code-Style
- **TypeScript**: Strikte Typisierung bevorzugt
- **ESLint + Prettier**: Automatische Formatierung
- **Komponenten**: Funktionale Komponenten mit Hooks
- **Naming**: camelCase für Variablen, PascalCase für Komponenten

### Dateistruktur
```
src/
├── components/
│   └── ComponentName.tsx      # PascalCase
├── hooks/
│   └── useHookName.ts         # camelCase mit 'use' Präfix
├── utils/
│   └── helperFunction.ts      # camelCase
└── types/
    └── interfaces.ts          # Typen-Definitionen
```

## 🧪 Testing

### Test-Typen
- **Unit Tests**: Einzelne Komponenten/Funktionen
- **Integration Tests**: Komponenten-Interaktionen
- **E2E Tests**: Komplette User-Journeys

### Test-Commands
```bash
npm run test              # Alle Tests
npm run test:watch        # Tests im Watch-Modus
npm run test:coverage     # Coverage-Report
npm run test:e2e         # End-to-End Tests
```

### Test-Beispiele
```typescript
// Unit Test
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

test('renders loading spinner', () => {
  render(<LoadingSpinner />);
  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
});

// Integration Test
test('user can select avatar', async () => {
  render(<AvatarSelection />);
  const foxAvatar = screen.getByAltText('Fuchs');
  fireEvent.click(foxAvatar);
  expect(foxAvatar).toHaveClass('selected');
});
```

## 📚 Dokumentation

### Code-Dokumentation
```typescript
/**
 * Authentifiziert einen Benutzer über Magic Link
 * @param email - Die E-Mail-Adresse des Benutzers
 * @returns Promise mit Authentifizierungsstatus
 */
export async function sendMagicLink(email: string): Promise<AuthResult> {
  // Implementation
}
```

### README-Updates
- Neue Features dokumentieren
- Installationsanleitungen aktualisieren
- Screenshots bei UI-Änderungen updaten

## 🚀 Deployment & Release

### Branch-Strategie
- `main`: Production-ready Code
- `develop`: Development Branch
- `feature/*`: Feature-Branches
- `bugfix/*`: Bug-Fix-Branches
- `hotfix/*`: Kritische Fixes

### Release-Prozess
1. Feature-Branch in `develop` mergen
2. Testing in Development-Environment
3. Release-Branch von `develop` erstellen
4. Final Testing & Bug Fixes
5. Merge in `main` + Tag erstellen
6. Deployment zur Production

## 👥 Community

### Verhaltenskodex
- **Respekt**: Höflicher Umgang miteinander
- **Konstruktivität**: Hilfsbereit und lösungsorientiert
- **Inklusivität**: Offen für alle Hintergründe und Erfahrungslevel
- **Geduld**: Zeit für Reviews und Diskussionen einräumen

### Kommunikation
- **Issues**: Für Bugs und Feature Requests
- **Discussions**: Für Fragen und Ideen
- **Pull Requests**: Für Code-Reviews

## 💯 Anerkennung

Alle Beiträge werden in der [Contributors](https://github.com/your-repo/graphs/contributors)-Sektion anerkannt.

Besondere Beiträge werden im [CHANGELOG.md](./CHANGELOG.md) erwähnt.

## ❓ Fragen?

Bei Fragen können Sie:
- Ein Issue erstellen
- Eine Discussion starten
- Per E-Mail kontaktieren: contribute@sticker-app.com

---

**Vielen Dank für Ihren Beitrag zur Pickerl-Sammel-App! 🚀**

Ihr Engagement macht diese App besser für alle Benutzer.