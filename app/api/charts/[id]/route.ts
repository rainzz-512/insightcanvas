// app/api/charts/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// (Optional) fetch single chart JSON – handy for client editing forms
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chart = await prisma.chart.findFirst({
      where: {
        id: params.id,
        dataset: { owner: { email: session.user.email! } },
      },
      select: {
        id: true,
        name: true,
        type: true,
        configJson: true,
        dataset: { select: { id: true, name: true, sampleRowsJson: true } },
        createdAt: true,
      },
    });

    if (!chart) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ chart });
  } catch (e) {
    console.error("GET /api/charts/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, configJson } = body ?? {};

    if (!type || !configJson) {
      return NextResponse.json(
        { error: "type and configJson are required" },
        { status: 400 }
      );
    }

    // Validate keys by type
    if (type === "pie") {
      if (!configJson?.labelKey || !configJson?.valueKey) {
        return NextResponse.json(
          { error: "Pie requires labelKey and valueKey" },
          { status: 400 }
        );
      }
    } else {
      if (!configJson?.xKey || !configJson?.yKey) {
        return NextResponse.json(
          { error: "Bar/Line require xKey and yKey" },
          { status: 400 }
        );
      }
    }

    // Ensure ownership through chart → dataset → owner
    const chart = await prisma.chart.findFirst({
      where: {
        id: params.id,
        dataset: { owner: { email: session.user.email! } },
      },
      select: { id: true },
    });
    if (!chart) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.chart.update({
      where: { id: params.id },
      data: {
        name: name ?? undefined,
        type,
        configJson,
      },
      select: { id: true },
    });

    return NextResponse.json({ chart: updated });
  } catch (e) {
    console.error("PATCH /api/charts/[id] error:", e);
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

    // Ownership check
    const chart = await prisma.chart.findFirst({
      where: {
        id: params.id,
        dataset: { owner: { email: session.user.email! } },
      },
      select: { id: true },
    });
    if (!chart) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.chart.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/charts/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}