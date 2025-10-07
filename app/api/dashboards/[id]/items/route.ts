// app/api/dashboards/[id]/items/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * PATCH /api/dashboards/:id/items
 * Body: { order: string[] }  // array of DashboardItem IDs in the new order
 * NOTE: we store the order inside layoutJson.order on each item (no schema change).
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

    const { order } = await req.json().catch(() => ({}));
    if (!Array.isArray(order) || order.some((s) => typeof s !== "string")) {
      return NextResponse.json(
        { error: "Body must be { order: string[] }" },
        { status: 400 }
      );
    }

    // verify ownership
    const dash = await prisma.dashboard.findFirst({
      where: { id: params.id, owner: { email: session.user.email } },
      select: { id: true },
    });
    if (!dash) {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    // fetch all items for this dashboard
    const items = await prisma.dashboardItem.findMany({
      where: { dashboardId: params.id },
      select: { id: true, layoutJson: true },
    });

    const validIds = new Set(items.map((i) => i.id));
    const filteredOrder = order.filter((id) => validIds.has(id));

    // apply order; anything missing goes after, preserving its relative order
    const missing = items.map((i) => i.id).filter((id) => !filteredOrder.includes(id));
    const finalOrder = [...filteredOrder, ...missing];

    // write layoutJson.order = index
    await prisma.$transaction(
      finalOrder.map((id, index) =>
        prisma.dashboardItem.update({
          where: { id },
          data: {
            layoutJson: {
              ...(items.find((i) => i.id === id)?.layoutJson as any),
              order: index,
            },
          } as any,
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/dashboards/[id]/items error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}