import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chartId } = await req.json();
    if (!chartId) {
      return NextResponse.json({ error: "chartId is required" }, { status: 400 });
    }

    // Check ownership
    const dashboard = await prisma.dashboard.findFirst({
      where: { id: params.id, owner: { email: session.user.email } },
      select: { id: true },
    });
    if (!dashboard) {
      return NextResponse.json({ error: "Dashboard not found or access denied" }, { status: 404 });
    }

    const chart = await prisma.chart.findFirst({
      where: { id: chartId, dataset: { owner: { email: session.user.email } } },
      select: { id: true },
    });
    if (!chart) {
      return NextResponse.json({ error: "Chart not found or access denied" }, { status: 404 });
    }

    // Create dashboard item (link between chart and dashboard)
    const item = await prisma.dashboardItem.create({
      data: {
        dashboardId: dashboard.id,
        chartId: chart.id,
        layoutJson: {}, // placeholder; used later for positions
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (e: any) {
    console.error("POST /api/dashboards/[id]/add-chart error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}