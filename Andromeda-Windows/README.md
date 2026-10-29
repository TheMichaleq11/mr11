# Andromeda na Windowsa

Okno aplikacji (Electron), w którym działa Andromeda z `https://andromeda-usos.vercel.app`.
Treść zawsze jest aktualna — każda zmiana wdrożona na Vercel od razu jest też w aplikacji, bez nowego instalatora.

Co dodaje okno:

- **Trzy tryby tła** — `Ctrl+Shift+B` przełącza po kolei (aplikacja uruchamia się wtedy ponownie, wybór zostaje zapamiętany):
  - **ostre** (domyślny) — okno jest w pełni przezroczyste, widać tylko dwa panele, a w odstępach prawdziwy pulpit.
    Klik w odstęp trafia w to, co jest pod spodem. Okno przesuwa się za górę panelu i za pole z logo,
    rozmiar zmienia się za brzegi (niewidoczne uchwyty tuż przy panelach).
  - **akryl** — systemowe szkło Windows 11 (rozmyty pulpit z odcieniem narzuconym przez Windows).
  - **rozmycie** — eksperymentalne rozmycie z prawie przezroczystym odcieniem (może nie działać na każdym Windowsie).
- Własne przyciski okna (zminimalizuj / zmaksymalizuj / zamknij) w prawym górnym rogu panelu.
- Logowanie do USOS/UJ w osobnym, zwykłym okienku; obce linki otwierają się w przeglądarce.
- Zapamiętany rozmiar i położenie okna, jedna kopia aplikacji naraz.
- Skróty: `F5` / `Ctrl+R` odśwież, `Ctrl` `+` `-` `0` powiększenie, `Alt+←` / `Alt+→` (i boczne przyciski myszy) wstecz/dalej,
  prawy przycisk — kopiuj/wklej.
- Ekran „Brak połączenia”, który sam wraca, gdy pojawi się internet.

Strona wie, że jest w oknie, po znaczniku w user-agencie `AndromedaOkno/<wersja> (ostre|szklo|zwykle)` —
ustawia wtedy `<html data-okno="…">` (`lib/motyw.ts`), style są na końcu `app/globals.css` (sekcja „OKNO WINDOWS”),
a przyciski okna w `components/OknoPrzyciski.tsx`.

## Instalator

Buduje się sam na GitHubie (Actions → „Andromeda na Windowsa”) przy każdej zmianie w tym folderze
i trafia do **Releases** jako `Andromeda-Setup-<wersja>.exe`. Nowa wersja instalatora = podbij `version` w `package.json`.

Instalator nie ma płatnego podpisu, więc Windows pokaże „System Windows ochronił ten komputer” →
„Więcej informacji” → „Uruchom mimo to”.

## Rozwój (Windows, PowerShell)

```powershell
cd Andromeda-Windows
npm install
npm start                                   # okno z andromeda-usos.vercel.app
$env:ANDROMEDA_URL="http://localhost:3000/"; npm start   # okno z lokalnym `npm run dev`
$env:ANDROMEDA_BEZ_SZKLA="1"; npm start     # podgląd bez szkła (jak na Windows 10)
npm run dist                                # instalator w dist\
```

Narzędzia programisty: `Shift+F12`.
