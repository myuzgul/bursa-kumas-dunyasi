'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';

export function TrackingScripts() {
  const [settings, setSettings] = useState<{
    meta_pixel_id?: string;
    ga4_measurement_id?: string;
    gtm_id?: string;
    is_active?: number;
  }>({});

  useEffect(() => {
    fetch('/api/admin/tracking-settings', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings && data.settings.is_active !== 0) {
          setSettings(data.settings);
        }
      })
      .catch(() => {});
  }, []);

  const { meta_pixel_id, ga4_measurement_id, gtm_id } = settings;

  return (
    <>
      {/* 1. Meta Pixel Base Script */}
      {meta_pixel_id && (
        <Script
          id="meta-pixel-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${meta_pixel_id}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {/* 2. Google Tag Manager */}
      {gtm_id && (
        <Script
          id="gtm-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtm_id}');
            `,
          }}
        />
      )}

      {/* 3. Google Analytics 4 (GA4) */}
      {ga4_measurement_id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4_measurement_id}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4_measurement_id}', {
                  send_page_view: true
                });
              `,
            }}
          />
        </>
      )}
    </>
  );
}
