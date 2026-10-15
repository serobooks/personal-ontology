import { NextResponse } from 'next/server';
import { fetchNotionCards } from '@/lib/notionService';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await fetchNotionCards();
  return NextResponse.json(result);
}

