import View from './view';

export const dynamicParams = true;
export const revalidate = false;
export function generateStaticParams() {
  return [];
}

export default function Page() {
  return <View />;
}
