// app/api/risk-analysis/route.ts - MAP ONLY VERSION (NO RISK ANALYSIS)
import { NextRequest, NextResponse } from 'next/server';

// DIY Bounds dari environment variables
const getDIYBounds = () => {
  const southWestLat = parseFloat(process.env.NEXT_PUBLIC_DIY_SOUTHWEST_LAT || '-8.35');
  const southWestLng = parseFloat(process.env.NEXT_PUBLIC_DIY_SOUTHWEST_LNG || '109.95');
  const northEastLat = parseFloat(process.env.NEXT_PUBLIC_DIY_NORTHEAST_LAT || '-7.35');
  const northEastLng = parseFloat(process.env.NEXT_PUBLIC_DIY_NORTHEAST_LNG || '110.85');
  
  return {
    southWest: [southWestLat, southWestLng],
    northEast: [northEastLat, northEastLng]
  };
};

const DIY_BOUNDS = getDIYBounds();

// Cache untuk data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = parseInt(process.env.NEXT_PUBLIC_CACHE_TTL || '1800000');

// ==================== MAIN API HANDLER ====================

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'Endpoint POST dinonaktifkan',
    message: 'Fitur analisis risiko telah dinonaktifkan',
    timestamp: new Date().toISOString(),
    available_endpoints: ['GET /api/risk-analysis']
  }, { status: 405 });
}

/**
 * GET handler untuk info peta saja
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const healthCheck = url.searchParams.get('health');
  
  if (healthCheck === 'true') {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      system_mode: 'MAP ONLY MODE - NO RISK ANALYSIS',
      region: 'Daerah Istimewa Yogyakarta, Indonesia',
      bounds: DIY_BOUNDS,
      available_features: ['Map Display', 'Layer Control', 'DIY Boundary'],
      disabled_features: ['Risk Analysis', 'Risk Markers', 'Environmental Data Fetching'],
      note: 'Sistem hanya menampilkan peta tanpa analisis risiko'
    });
  }
  
  // Basic info
  return NextResponse.json({
    name: 'DIY Map Service',
    version: '1.0.0',
    description: 'Map display service for DIY Yogyakarta region - Risk analysis disabled',
    status: 'MAP_ONLY_MODE',
    mode: 'MAP DISPLAY ONLY (NO RISK ANALYSIS)',
    endpoints: {
      GET: '/api/risk-analysis',
      'GET-health': '/api/risk-analysis?health=true'
    },
    disabled_endpoints: ['POST /api/risk-analysis'],
    region: 'Daerah Istimewa Yogyakarta, Indonesia',
    timestamp: new Date().toISOString(),
    operational: true
  });
}

/**
 * OPTIONS handler untuk CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}