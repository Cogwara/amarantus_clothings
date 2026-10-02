import { Metadata } from 'next';
import { query } from '@/lib/db';
import FrontShopClient from './front-shop-client';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const itemParam =
    typeof resolvedParams?.item === 'string'
      ? resolvedParams.item.trim()
      : Array.isArray(resolvedParams?.item) && resolvedParams?.item[0]
      ? resolvedParams.item[0].trim()
      : null;

  if (itemParam) {
    try {
      const res = await query(
        `
        SELECT 
          p.id,
          p.sku,
          p.name,
          p."sellingPrice",
          p.condition,
          p.size,
          p.brand,
          p.description,
          COALESCE(
            (SELECT url FROM product_images WHERE "productId" = p.id AND "isPrimary" = true LIMIT 1),
            (SELECT url FROM product_images WHERE "productId" = p.id ORDER BY "createdAt" ASC LIMIT 1)
          ) as "imageUrl"
        FROM products p
        WHERE LOWER(p.sku) = LOWER($1) OR p.id = $1
        LIMIT 1
      `,
        [itemParam]
      );

      if (res.rows.length > 0) {
        const item = res.rows[0];
        let rawImageUrl = item.imageUrl;

        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          (process.env.NEXTAUTH_URL &&
          !process.env.NEXTAUTH_URL.includes('localhost') &&
          !process.env.NEXTAUTH_URL.includes('127.0.0.1')
            ? process.env.NEXTAUTH_URL
            : 'https://amarantus-clothings.vercel.app');
        let ogImageUrl = rawImageUrl;
        if (ogImageUrl && ogImageUrl.startsWith('/')) {
          ogImageUrl = `${appUrl.replace(/\/$/, '')}${ogImageUrl}`;
        }
        if (!ogImageUrl) {
          ogImageUrl =
            'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80';
        }

        const priceText = item.sellingPrice
          ? `₦${Number(item.sellingPrice).toLocaleString('en-NG')}`
          : '';
        const sizeText = item.size ? `Size: ${item.size}` : '';
        const conditionText = item.condition ? `Condition: ${item.condition}` : '';
        const details = [priceText, sizeText, conditionText]
          .filter(Boolean)
          .join(' • ');

        const title = `${item.name} ${priceText ? `(${priceText})` : ''} | AMARANTUS CLOTHINGS`;
        const description = `${item.name}${details ? ` — ${details}` : ''}. ${
          item.description ||
          'Premium UK Grade A Thrift & Vintage Fashion at unbeatable prices. Fast nationwide delivery.'
        }`;

        return {
          title,
          description,
          openGraph: {
            title,
            description,
            url: `https://amarantus-clothings.vercel.app/?item=${encodeURIComponent(
              item.sku || item.id
            )}`,
            siteName: 'AMARANTUS CLOTHINGS',
            images: [
              {
                url: ogImageUrl,
                width: 1200,
                height: 800,
                alt: item.name,
              },
            ],
            locale: 'en_NG',
            type: 'website',
          },
          twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImageUrl],
          },
        };
      }
    } catch (e) {
      console.error('Error generating product metadata:', e);
    }
  }

  // Fallback to default storefront metadata
  return {
    title: 'AMARANTUS CLOTHINGS | UK Grade A Thrift & Fashion Store in Nigeria',
    description:
      'Shop premium UK Grade A thrift, vintage, and modern clothing in Nigeria. Hand-picked quality shirts, trousers, jackets, dresses, and streetwear delivered right to your door.',
    openGraph: {
      title: 'AMARANTUS CLOTHINGS | UK Grade A Thrift & Fashion Store in Nigeria',
      description:
        'Shop premium UK Grade A thrift, vintage, and modern clothing in Nigeria. Hand-picked quality shirts, trousers, jackets, dresses, and streetwear delivered right to your door.',
      url: 'https://amarantus-clothings.vercel.app',
      siteName: 'AMARANTUS CLOTHINGS',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
          width: 1200,
          height: 800,
          alt: 'Amarantus Clothings',
        },
      ],
      locale: 'en_NG',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AMARANTUS CLOTHINGS | UK Grade A Thrift & Fashion Store in Nigeria',
      description:
        'Shop premium UK Grade A thrift, vintage, and modern clothing in Nigeria. Hand-picked quality shirts, trousers, jackets, dresses, and streetwear delivered right to your door.',
      images: [
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
      ],
    },
  };
}

export default function Page() {
  return <FrontShopClient />;
}
