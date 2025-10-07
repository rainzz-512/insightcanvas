// app/api/dashboards/[id]/layout/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * PATCH /api/dashboards/:id/layout
 * Body: { items: Array<{ id: string; x: number; y: number; w: number; h: number }> }
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const items: Array<{ id: string; x: number; y: number; w: number; h: number }> =
      Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Ensure the dashboard belongs to the user
    const dash = await prisma.dashboard.findFirst({
      where: { id: params.id, owner: { email: session.user.email } },
      select: { id: true },
    });
    if (!dash) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Update each DashboardItem.layoutJson
    await prisma.$transaction(
      items.map((i) =>
        prisma.dashboardItem.update({
          where: { id: i.id },
          data: { layoutJson: { x: i.x, y: i.y, w: i.w, h: i.h } },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH /api/dashboards/[id]/layout error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}