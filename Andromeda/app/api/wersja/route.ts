// Aktualna wersja aplikacji na serwerze (bez pamięci podręcznej).
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ wersja: process.env.NEXT_PUBLIC_WERSJA ?? '' }, { headers: { 'Cache-Control': 'no-store' } });
}
