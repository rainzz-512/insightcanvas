// app/api/datasets/[id]/route.ts
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
        sampleRowsJson: true, // <-- include samples
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    // Return flat dataset (no { dataset: ... } wrapper)
    return NextResponse.json(dataset);
  } catch (err) {
    console.error("GET /api/datasets/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}