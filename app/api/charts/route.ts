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

    const body = await req.json();

    const datasetId: string | undefined = body.datasetId;
    const type: string | undefined = body.type;
    const name: string | undefined = body.name;

    // Accept either `configJson` OR legacy top-level keys (xKey/yKey or labelKey/valueKey)
    let configJson = body.configJson as
      | { xKey?: string; yKey?: string; labelKey?: string; valueKey?: string }
      | undefined;

    // Back-compat: build configJson if not provided
    if (!configJson) {
      const { xKey, yKey, labelKey, valueKey } = body;
      if (type === "pie") {
        configJson = { labelKey, valueKey };
      } else {
        configJson = { xKey, yKey };
      }
    }

    // Validate minimal requirements
    if (!datasetId || !type) {
      return NextResponse.json(
        { error: "datasetId and type are required" },
        { status: 400 }
      );
    }

    // Validate config keys depending on type
    if (type === "pie") {
      if (!configJson?.labelKey || !configJson?.valueKey) {
        return NextResponse.json(
          { error: "labelKey and valueKey are required for pie" },
          { status: 400 }
        );
      }
    } else {
      if (!configJson?.xKey || !configJson?.yKey) {
        return NextResponse.json(
          { error: "xKey and yKey are required for bar/line" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure dataset belongs to user
    const dataset = await prisma.dataset.findFirst({
      where: { id: datasetId, ownerId: user.id },
      select: { id: true },
    });
    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    const chart = await prisma.chart.create({
      data: {
        name:
          name ??
          (type === "pie"
            ? `${configJson.labelKey} split by ${configJson.valueKey}`
            : `${configJson.xKey} vs ${configJson.yKey}`),
        type,
        configJson,
        datasetId: dataset.id,
      },
    });

    return NextResponse.json({ chart });
  } catch (err: any) {
    console.error("POST /api/charts error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}