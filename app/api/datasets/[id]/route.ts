import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
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

    const dataset = await prisma.dataset.findFirst({
      where: { id: params.id, ownerId: user.id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        rowCount: true,
        schemaJson: true,
        sampleRowsJson: true,
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    return NextResponse.json(dataset); // flattened (what your chart/new page expects)
  } catch (err: any) {
    console.error("GET /api/datasets/[id] error:", err);
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

    // must own it
    const owned = await prisma.dataset.findFirst({
      where: { id: params.id, owner: { email: session.user.email } },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    const updated = await prisma.dataset.update({
      where: { id: params.id },
      data: { name },
      select: { id: true, name: true },
    });

    return NextResponse.json({ dataset: updated });
  } catch (e) {
    console.error("PUT /api/datasets/[id] error:", e);
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

    // Check ownership
    const owned = await prisma.dataset.findFirst({
      where: { id: params.id, owner: { email: session.user.email } },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    // Cascade: remove dashboard items for charts in this dataset, remove charts, then dataset
    const charts = await prisma.chart.findMany({
      where: { datasetId: params.id },
      select: { id: true },
    });
    const chartIds = charts.map((c) => c.id);

    if (chartIds.length) {
      await prisma.dashboardItem.deleteMany({ where: { chartId: { in: chartIds } } });
      await prisma.chart.deleteMany({ where: { id: { in: chartIds } } });
    }

    await prisma.dataset.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/datasets/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}