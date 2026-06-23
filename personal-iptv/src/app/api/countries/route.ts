import { NextResponse } from 'next/server';
import channelsDb from '@/data/channels-db.json';

export async function GET() {
  try {
    const counts: Record<string, { name: string; code: string; count: number }> = {};
    
    channelsDb.forEach(ch => {
      const code = ch.countryCode;
      const name = ch.countryName || code.toUpperCase();
      if (!counts[code]) {
        counts[code] = { name, code, count: 0 };
      }
      counts[code].count++;
    });
    
    // Sort by count descending (showing countries with most channels first)
    const list = Object.values(counts).sort((a, b) => b.count - a.count);
    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
