import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Controlla database connection
    const { db } = await import("@/lib/db")
    
    // Test rapido database
    const healthCheck = await db.$queryRaw`SELECT 1 as health`
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      server: "operational", 
      uptime: process.uptime(),
      message: "✅ PropControl Dashboard API is running"
    }, { 
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    })
  } catch (error: any) {
    console.error("❌ Health check failed:", error)
    
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected", 
      server: "degraded",
      error: error.message,
      message: "🚨 PropControl Dashboard API has issues"
    }, { 
      status: 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache", 
        "Expires": "0"
      }
    })
  }
}

export async function POST() {
  return NextResponse.json({
    status: "ready",
    timestamp: new Date().toISOString(),
    message: "✅ Ready to receive MT5 data"
  }, { status: 200 })
}
