# Andromeda na Windowsa

Okno aplikacji (Electron), w którym działa Andromeda z `https://andromeda-usos.vercel.app`.
Treść zawsze jest aktualna — każda zmiana wdrożona na Vercel od razu jest też w aplikacji, bez nowego instalatora.

Co dodaje okno:

- **Szkło** — na Windows 11 (22H2 i nowszy) tło okna to rozmyty pulpit (akryl Windows). Panele Andromedy są półprzezroczyste,
  a w odstępach między nimi widać pulpit. Jasne motywy (Jasny, Błękit) dają jasny akryl, ciemne (Ciemny, Noc) — ciemny.
  Na Windows 10 okno ma zwykłe tło. Gdy okno nie jest aktywne, Windows sam zamienia akryl na jednolity kolor.
- Natywne przyciski okna (minimalizuj / maksymalizuj / zamknij) w kolorze pasującym do motywu; okno przeciąga się
  za odstępy między panelami.
- Logowanie do USOS w oknie aplikacji; obce linki otwierają się w przeglądarce.
- Zapamiętany rozmiar i położenie okna, jedna kopia aplikacji naraz.
- Skróty: `F5` / `Ctrl+R` odśwież, `Ctrl` `+` `-` `0` powiększenie, `Alt+←` / `Alt+→` (i boczne przyciski myszy) wstecz/dalej,
  prawy przycisk — kopiuj/wklej.
- Ekran „Brak połączenia”, który sam wraca, gdy pojawi się internet.

Strona wie, że jest w oknie, po znaczniku w user-agencie `AndromedaOkno/<wersja> (szklo|zwykle)` —
ustawia wtedy `<html data-okno="…">` (`lib/motyw.ts`), a style są na końcu `app/globals.css` (sekcja „OKNO WINDOWS”).

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
