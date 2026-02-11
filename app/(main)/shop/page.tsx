import { getShopData } from '@/actions/shop';
import { ShopClient } from './shop-client';

export default async function ShopPage() {
  const data = await getShopData();

  return (
    <ShopClient
      initialCoins={data?.coins ?? 0}
      initialHearts={data?.hearts ?? 0}
    />
  );
}
