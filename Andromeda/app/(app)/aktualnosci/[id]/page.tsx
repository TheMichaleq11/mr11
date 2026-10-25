import View from './view';

// Strona jest tylko "ramką" — dane ładują się po stronie telefonu. Generujemy ją przy pierwszym
// wejściu i trzymamy w cache Vercela, więc kolejne otwarcia nie czekają na serwer.
export const dynamicParams = true;
export const revalidate = false;
export function generateStaticParams() {
  return [];
}

export default function Page() {
  return <View />;
}
