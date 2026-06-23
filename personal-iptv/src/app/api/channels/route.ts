import { NextResponse } from 'next/server';
import channelsDb from '@/data/channels-db.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase().trim() || '';
    const category = searchParams.get('category')?.toLowerCase().trim() || '';
    const country = searchParams.get('country')?.toLowerCase().trim() || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let filtered = channelsDb;

    // Apply category filter if present
    if (category) {
      filtered = filtered.filter(ch => ch.category && ch.category.toLowerCase() === category);
    }

    // Apply country filter if present
    if (country) {
      filtered = filtered.filter(ch => ch.countryCode.toLowerCase() === country);
    }

    // Apply search query if present
    if (q) {
      filtered = filtered.filter(ch => 
        ch.name.toLowerCase().includes(q) || 
        (ch.category && ch.category.toLowerCase().includes(q)) || 
        (ch.countryName && ch.countryName.toLowerCase().includes(q))
      );
    }

    return NextResponse.json(filtered.slice(0, limit));
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
