'use client';

import React from 'react';
import { Game } from '@/components/Game';

export default function GamePage() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>発音練習ゲーム</h1>
      <Game />
    </main>
  );
}
