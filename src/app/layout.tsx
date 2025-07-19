// src/app/layout.tsx
import './globals.css';
import React from 'react';

export const metadata = {
  title: 'AnkiApp 発音練習ゲーム',
  description: '発音をチェックするWebアプリです',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head />
      <body>{children}</body>
    </html>
  );
}
