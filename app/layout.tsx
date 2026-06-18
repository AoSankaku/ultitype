import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "UltiType",
  description: "Advanced typing practice for high-speed typists.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Inter:wght@400;700;900&family=M+PLUS+1:wght@400;700;900&family=Noto+Sans:wght@400;700;900&family=Noto+Sans+JP:wght@400;600;700;900&family=Noto+Serif+JP:wght@400;700;900&family=Quantico:ital,wght@0,400;0,700;1,400;1,700&family=Roboto:wght@400;700;900&family=Source+Code+Pro:wght@400;700;900&family=Trispace:wght@100..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
