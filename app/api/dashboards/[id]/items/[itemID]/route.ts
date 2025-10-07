import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the item belongs to the user's dashboard
    const item = await prisma.dashboardItem.findFirst({
      where: {
        id: params.itemId,
        dashboard: { id: params.id, owner: { email: session.user.email } },
      },
      select: { id: true },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.dashboardItem.delete({ where: { id: params.itemId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/dashboards/[id]/items/[itemId] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}