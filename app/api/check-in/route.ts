import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

type ConfigFields = {
  prefix: boolean;
  firstname: boolean;
  lastname: boolean;
  studentId: boolean;
  email: boolean;
  section: boolean;
  photo: boolean;
  note: boolean;
  location: boolean;
};

type FormConfig = {
  type: "global_config";
  config: ConfigFields;
  updatedAt: Date;
};

const defaultConfig: ConfigFields = {
  prefix: true,
  firstname: true,
  lastname: true,
  studentId: true,
  email: true,
  section: true,
  photo: true,
  note: true,
  location: true,
};

function validateConfig(config: unknown): config is ConfigFields {
  if (typeof config !== "object" || config === null) return false;

  const c = config as Record<string, unknown>;

  const fields: (keyof ConfigFields)[] = [
    "prefix",
    "firstname",
    "lastname",
    "studentId",
    "email",
    "section",
    "photo",
    "note",
    "location",
  ];

  return fields.every((f) => typeof c[f] === "boolean");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { config } = body;

    if (!validateConfig(config)) {
      return NextResponse.json(
        { success: false, message: "invalid config" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");
    const checkIn = db.collection<FormConfig>("checkIn");

    const safeConfig = { ...defaultConfig, ...config };

    await checkIn.updateOne(
      { type: "global_config" },
      {
        $set: {
          type: "global_config",
          config: safeConfig,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      config: safeConfig,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("attendance");
    const checkIn = db.collection<FormConfig>("checkIn");

    const result = await checkIn.findOne({
      type: "global_config",
    });

    const config = result?.config
      ? { ...defaultConfig, ...result.config }
      : defaultConfig;

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: (err as Error).message },
      { status: 500 }
    );
  }
}