# Andromeda

Czytelna nakładka na USOS UJ: plan zajęć, oceny i przedmioty. Działa w przeglądarce na komputerze, a na iPhonie i Androidzie instaluje się jak aplikacja (PWA).

## Jak to działa

- Logowanie przez oficjalną stronę USOS (OAuth 1.0a). Aplikacja nie widzi hasła.
- Token dostępu jest zaszyfrowany w ciasteczku użytkownika. Na serwerze nic nie jest zapisywane.
- Dane pobierane na żywo z USOS API UJ (`apps.usos.uj.edu.pl`):
  - plan: `services/tt/student`
  - przedmioty i semestry: `services/courses/user`
  - oceny: `services/grades/terms2`
  - prowadzący: `services/users/users`
  - zapisy: `services/registrations/*` (tury, przedmioty, `register` / `unregister`)
  - sprawdziany: `services/crstests/*`
  - kalendarz akademicki: `services/calendar/search`
  - budynki: `services/geo/building_index`
  - profil i legitymacja: `services/users/user`, `services/progs/student`, `services/cards/user`
  - płatności: `services/payments/user_payments`
  - ankiety (z wypełnianiem): `services/surveys/*`
  - aktualności: `services/news/*`
- Bez klucza API działa tryb demo z przykładowymi danymi.

## Konfiguracja (Vercel → Settings → Environment Variables)

| Zmienna | Opis |
| --- | --- |
| `USOS_CONSUMER_KEY` | Consumer Key z https://apps.usos.uj.edu.pl/developers/ |
| `USOS_CONSUMER_SECRET` | Consumer Secret z tego samego miejsca |
| `USOS_BASE_URL` | opcjonalnie, domyślnie `https://apps.usos.uj.edu.pl` |
| `SESSION_SECRET` | opcjonalnie, własny sekret do szyfrowania sesji |

Po dodaniu zmiennych trzeba zrobić ponowne wdrożenie (Redeploy).

## Instalacja na telefonie

- **iPhone:** Safari → przycisk Udostępnij → „Do ekranu początkowego”.
- **Android:** Chrome → menu ⋮ → „Zainstaluj aplikację” / „Dodaj do ekranu głównego”.

## Rozwój lokalny (Windows)

```powershell
npm install
copy .env.example .env.local   # uzupełnij klucze albo zostaw puste (tryb demo)
npm run dev
```

Testy: `npm run test:oauth` (podpis OAuth), `npm run test:usos` i `npx tsx scripts/test-more.mts` (przetwarzanie odpowiedzi USOS).

Po zmianie listy uprawnień (`SCOPES` w `lib/usos.ts`) każdy użytkownik musi raz zalogować się ponownie.
