import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Robust JSON parse
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { datasetId, name, type, config } = body ?? {};
    if (!datasetId || !type || !config) {
      return NextResponse.json(
        { error: "datasetId, type, and config are required" },
        { status: 400 }
      );
    }

    // validate config shape (bar/line vs pie)
    if (type === "pie") {
      if (!config.labelKey || !config.valueKey) {
        return NextResponse.json(
          { error: "For pie: config.labelKey and config.valueKey are required" },
          { status: 400 }
        );
      }
    } else {
      if (!config.xKey || !config.yKey) {
        return NextResponse.json(
          { error: "For bar/line: config.xKey and config.yKey are required" },
          { status: 400 }
        );
      }
    }

    // Verify current user + dataset ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dataset = await prisma.dataset.findFirst({
      where: { id: datasetId, ownerId: user.id },
      select: { id: true },
    });
    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    const chart = await prisma.chart.create({
      data: {
        name: name || "Untitled chart",
        type,
        configJson: config,
        datasetId: dataset.id,
      },
      select: { id: true },
    });

    // Always return JSON
    return NextResponse.json({ id: chart.id }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/charts error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}