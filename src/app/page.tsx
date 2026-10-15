import React from 'react';
import { fetchNotionCards } from '@/lib/notionService';
import CatalogTerminalClient from '@/components/CatalogTerminalClient';

export const dynamic = 'force-dynamic';

export default async function CatalogTerminalPage() {
  const data = await fetchNotionCards();
  return (
    <CatalogTerminalClient
      initialCards={data.cards}
      initialSource={data.source}
    />
  );
}
