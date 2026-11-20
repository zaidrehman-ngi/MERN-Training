export async function GET() {
  let api = "down";

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/books?limit=1`,
    );
    if (response.ok) api = "up";
  } catch {}

  return Response.json({ web: "up", api, checkedAt: new Date().toISOString() });
}
