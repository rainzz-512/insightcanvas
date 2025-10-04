import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

// Helper: basic type inference for a column
function inferType(values: string[]): "number" | "date" | "string" {
  // Sample a reasonable number of values (skip empty)
  const sample = values.filter(v => v?.trim() !== "").slice(0, 50);

  if (sample.length === 0) return "string";

  const isNumber = sample.every(v => /^-?\d+(\.\d+)?$/.test(v.trim()));
  if (isNumber) return "number";

  const isDate = sample.every(v => {
    const d = new Date(v);
    return !isNaN(d.getTime());
  });
  if (isDate) return "date";

  return "string";
}

export async function POST(req: Request) {
  try {
    // 1) Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Parse multipart/form-data
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const filename = file.name || "dataset.csv";
    const text = await file.text();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    // 3) Parse CSV text into rows (first row = headers)
    const records: string[][] = parse(text, {
      bom: true,
      skip_empty_lines: true,
    });

    if (records.length === 0) {
      return NextResponse.json({ error: "CSV has no rows" }, { status: 400 });
    }

    const headers = records[0];
    const dataRows = records.slice(1);

    if (headers.length === 0) {
      return NextResponse.json({ error: "CSV has no columns" }, { status: 400 });
    }

    // 4) Build columns and infer types
    // Collect values per column
    const columns: { name: string; type: "string" | "number" | "date" }[] = [];
    for (let colIdx = 0; colIdx < headers.length; colIdx++) {
      const colName = String(headers[colIdx] ?? `col_${colIdx + 1}`).trim() || `col_${colIdx + 1}`;
      const colValues = dataRows.map(row => String(row[colIdx] ?? "").trim());
      const t = inferType(colValues);
      columns.push({ name: colName, type: t });
    }

    // 5) Count rows
    const rowsCount = dataRows.length;

    // 6) Find the owner user (by email from session)
    const owner = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });
    if (!owner) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 7) Save dataset metadata
    const dataset = await prisma.dataset.create({
      data: {
        name: filename,
        ownerId: owner.id,
        rowCount: rowsCount,
        schemaJson: {
          columns, // [{ name, type }]
        },
      },
      select: { id: true, name: true, rowCount: true, schemaJson: true, createdAt: true },
    });

    // 8) Respond with summary
    return NextResponse.json({
      success: true,
      dataset,
      columns: columns.map(c => c.name),
      types: columns.map(c => c.type),
      rowsCount,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Failed to process CSV" },
      { status: 500 }
    );
  }
}
