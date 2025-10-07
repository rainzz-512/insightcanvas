import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/dashboards
 * List dashboards owned by the signed-in user (minimal fields for pickers/lists)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dashboards = await prisma.dashboard.findMany({
      where: { owner: { email: session.user.email } },
      select: { id: true, name: true, isPublic: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ dashboards });
  } catch (e) {
    console.error("GET /api/dashboards error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/dashboards
 * Create a new dashboard for the signed-in user
 * Body: { name: string }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dashboard = await prisma.dashboard.create({
      data: {
        name: name.trim(),
        ownerId: user.id,
        isPublic: false,
      },
      select: { id: true, name: true, isPublic: true, createdAt: true },
    });

    return NextResponse.json({ dashboard });
  } catch (e) {
    console.error("POST /api/dashboards error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}