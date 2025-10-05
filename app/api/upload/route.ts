// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

function inferType(values: string[]): "number" | "date" | "string" {
  const sample = values.filter(v => v?.trim() !== "").slice(0, 50);
  if (sample.length === 0) return "string";

  const isNumber = sample.every(v => /^-?\d+(\.\d+)?$/.test(v.trim()));
  if (isNumber) return "number";

  const isDate = sample.every(v => !isNaN(new Date(v).getTime()));
  if (isDate) return "date";

  return "string";
}

export async function POST(req: Request) {
  try {
    // 1) Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Read multipart form and file
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const filename = file.name || "dataset.csv";
    const text = await file.text();
    if (!text?.trim()) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    // 3) Parse CSV
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

    // 4) Infer column types
    const columns = headers.map((h, colIdx) => {
      const name = String(h ?? `col_${colIdx + 1}`).trim() || `col_${colIdx + 1}`;
      const colValues = dataRows.map(row => String(row[colIdx] ?? "").trim());
      return { name, type: inferType(colValues) };
    });

    // 5) Sample rows (first 10) as objects
    const SAMPLE_LIMIT = 10;
    const sampleRows = dataRows.slice(0, SAMPLE_LIMIT).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        const key = String(h ?? `col_${i + 1}`);
        obj[key] = String(row[i] ?? "");
      });
      return obj;
    });

    // 6) Find owner
    const owner = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });
    if (!owner) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 7) Save dataset (matches your Dataset model)
    const dataset = await prisma.dataset.create({
      data: {
        name: filename,
        ownerId: owner.id,
        rowCount: dataRows.length,
        schemaJson: { columns },
        sampleRowsJson: sampleRows,
      },
      select: {
        id: true,
        name: true,
        rowCount: true,
        schemaJson: true,
        sampleRowsJson: true,
        createdAt: true,
      },
    });

    // 8) Respond
    return NextResponse.json({
      success: true,
      dataset,
      columns: columns.map(c => c.name),
      types: columns.map(c => c.type),
      rowsCount: dataRows.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Failed to process CSV" }, { status: 500 });
  }
}