// Sprawdza podpis OAuth 1.0a na dwóch znanych przykładach z wynikami referencyjnymi.
import { signedParams } from '../lib/oauth.ts';

const cases = [
  {
    name: 'OAuth 1.0a — przykład "photos.example.net" (Community Edition / RFC 5849)',
    expected: 'tR3+Ty81lMeYAr/Fid0kMTYa/WM=',
    p: signedParams(
      'GET',
      'http://photos.example.net/photos',
      { consumerKey: 'dpf43f3p2l4k3l03', consumerSecret: 'kd94hf93k423kf44', token: 'nnch734d00sl2jdk', tokenSecret: 'pfkkdhi9sl3r4s00' },
      { file: 'vacation.jpg', size: 'original' },
      {},
      { timestamp: '1191242096', nonce: 'kllo9940pd9333jh' },
    ),
  },
  {
    name: 'Twitter — "Creating a signature"',
    expected: 'hCtSmYh+iHYCEqBWrE7C7hYmtUk=',
    p: signedParams(
      'POST',
      'https://api.twitter.com/1.1/statuses/update.json',
      {
        consumerKey: 'xvz1evFS4wEEPTGEFPHBog',
        consumerSecret: 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw',
        token: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb',
        tokenSecret: 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE',
      },
      { status: 'Hello Ladies + Gentlemen, a signed OAuth request!', include_entities: 'true' },
      {},
      { timestamp: '1318622958', nonce: 'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg' },
    ),
  },
];

let bad = 0;
for (const c of cases) {
  const ok = c.p.oauth_signature === c.expected;
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'BŁĄD'} ${c.name}: ${c.p.oauth_signature}${ok ? '' : ` (oczekiwano ${c.expected})`}`);
}
process.exit(bad ? 1 : 0);
