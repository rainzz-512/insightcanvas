import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Ensure the signed-in user owns the chart (through its dataset -> owner).
 */
async function getOwnedChart(id: string, email?: string | null) {
  if (!email) return null;
  return prisma.chart.findFirst({
    where: { id, dataset: { owner: { email } } },
    select: {
      id: true,
      name: true,
      type: true,
      configJson: true,
      createdAt: true,
      dataset: { select: { id: true, name: true } },
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const chart = await getOwnedChart(params.id, session?.user?.email);
    if (!chart) {
      return NextResponse.json({ error: "Chart not found" }, { status: 404 });
    }
    return NextResponse.json({ chart });
  } catch (e) {
    console.error("GET /api/charts/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const name = (body?.name ?? "").toString().trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const owned = await getOwnedChart(params.id, session.user.email);
    if (!owned) {
      return NextResponse.json({ error: "Chart not found" }, { status: 404 });
    }

    const updated = await prisma.chart.update({
      where: { id: params.id },
      data: { name },
      select: { id: true, name: true },
    });

    return NextResponse.json({ chart: updated });
  } catch (e) {
    console.error("PUT /api/charts/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const owned = await getOwnedChart(params.id, session.user.email);
    if (!owned) {
      return NextResponse.json({ error: "Chart not found" }, { status: 404 });
    }

    // Remove dashboard items that reference this chart first (FK constraint)
    await prisma.dashboardItem.deleteMany({ where: { chartId: params.id } });
    await prisma.chart.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/charts/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}