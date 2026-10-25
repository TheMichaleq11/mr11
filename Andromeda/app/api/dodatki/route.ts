// Dodatkowe sekcje istniejących ekranów (każda ładuje się osobno i nie psuje reszty, gdy brakuje zgody).
import { BadRequest, withSession } from '@/lib/api';
import * as demo from '@/lib/demo-extra';
import * as x from '@/lib/usos-extra';

export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  const what = new URL(req.url).searchParams.get('co');
  return withSession(async ({ creds }) => {
    switch (what) {
      case 'oceny':
        return creds ? { latest: await x.soft(() => x.fetchLatestGrades(creds)) } : { latest: { data: demo.demoLatestGrades() } };
      case 'platnosci':
        return creds
          ? await Promise.all([x.soft(() => x.fetchAccounts(creds)), x.soft(() => x.fetchRemittances(creds))]).then(([accounts, remittances]) => ({ accounts, remittances }))
          : { accounts: { data: demo.demoAccounts() }, remittances: { data: demo.demoRemittances() } };
      case 'profil':
        return creds
          ? await Promise.all([x.soft(() => x.fetchMCard(creds)), x.soft(() => x.fetchPhotoVisibility(creds))]).then(([mcard, photo]) => ({ mcard, photo }))
          : { mcard: { data: demo.demoMCard() }, photo: { data: 'Twoje zdjęcie widzą prowadzący i pracownicy dziekanatu (demo).' } };
      case 'koszyk':
        return creds ? { cart: await x.soft(() => x.fetchCart(creds)) } : { cart: { data: demo.demoCart() } };
      case 'grupy':
        return creds
          ? await Promise.all([
              x.soft(() => x.fetchPrimaryGroups(creds)),
              x.soft(() => x.fetchCustomGroups(creds)),
              x.soft(() => x.fetchSentMessages(creds)),
            ]).then(([primary, custom, sent]) => ({ primary, custom, sent }))
          : { primary: { data: demo.demoPrimaryGroups() }, custom: { data: demo.demoCustomGroups() }, sent: { data: demo.demoSent() } };
      default:
        throw new BadRequest('Nieznana sekcja.');
    }
  });
}
