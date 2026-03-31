// Health check endpoint
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}
