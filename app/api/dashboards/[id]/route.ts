// app/api/dashboards/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/dashboards/:id  -> returns a dashboard the user owns (with items + charts)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dashboard = await prisma.dashboard.findFirst({
      where: { id: params.id, ownerId: user.id },
      select: {
        id: true,
        name: true,
        isPublic: true,
        createdAt: true,
        items: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            layoutJson: true,
            chart: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!dashboard) {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    return NextResponse.json({ dashboard });
  } catch (err: any) {
    console.error("GET /api/dashboards/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/dashboards/:id  -> update item order/layout (used later)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const items: Array<{ id: string; layoutJson?: any }> = body?.items ?? [];

    // Ensure the dashboard belongs to the user
    const dash = await prisma.dashboard.findFirst({
      where: { id: params.id, ownerId: user.id },
      select: { id: true },
    });
    if (!dash) {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    // Update each item’s layoutJson (simple example)
    await Promise.all(
      items.map((it) =>
        prisma.dashboardItem.update({
          where: { id: it.id },
          data: { layoutJson: it.layoutJson ?? {} },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("PUT /api/dashboards/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}