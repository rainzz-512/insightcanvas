import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function requireSessionEmail() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return email;
}

async function getOwnedChartOr404(id: string, ownerEmail: string) {
  const chart = await prisma.chart.findFirst({
    where: { id, dataset: { owner: { email: ownerEmail } } },
    select: {
      id: true,
      name: true,
      type: true,
      configJson: true,
      createdAt: true,
      dataset: {
        select: {
          id: true,
          name: true,
          // include both; editor may need schema when sample rows are empty
          schemaJson: true,
          sampleRowsJson: true,
        },
      },
    },
  });
  if (!chart) throw NextResponse.json({ error: 'Not found' }, { status: 404 });
  return chart;
}

// GET /api/charts/:id  -> { chart: {...} }
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const email = await requireSessionEmail();
    const chart = await getOwnedChartOr404(params.id, email);
    return NextResponse.json({ chart });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/charts/:id  (name, type, configJson) -> { chart: {...} }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const email = await requireSessionEmail();
    // Ensure the user owns it (throws 404 if not)
    await getOwnedChartOr404(params.id, email);

    const body = await req.json().catch(() => ({} as any));
    const { name, type, configJson } = body as {
      name?: string;
      type?: 'bar' | 'line' | 'pie';
      configJson?:
        | { xKey: string; yKey: string }
        | { labelKey: string; valueKey: string };
    };

    if (!name || !type || !configJson) {
      return NextResponse.json(
        { error: 'Missing required fields (name, type, configJson).' },
        { status: 400 }
      );
    }

    const updated = await prisma.chart.update({
      where: { id: params.id },
      data: { name, type, configJson },
      select: {
        id: true,
        name: true,
        type: true,
        configJson: true,
        createdAt: true,
        dataset: {
          select: {
            id: true,
            name: true,
            schemaJson: true,
            sampleRowsJson: true,
          },
        },
      },
    });

    return NextResponse.json({ chart: updated });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/charts/:id -> { ok: true }
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const email = await requireSessionEmail();
    // Ensure ownership
    await getOwnedChartOr404(params.id, email);

    // Remove from any dashboards first
    await prisma.dashboardItem.deleteMany({ where: { chartId: params.id } });
    await prisma.chart.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}