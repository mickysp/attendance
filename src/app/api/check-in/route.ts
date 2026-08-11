import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import type {
  CheckInConfigFields,
  CheckInConfigDocument,
  UpdateCheckInConfigBody,
} from "@/types/check-in";

const defaultConfig: CheckInConfigFields = {
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

function validateConfig(config: unknown): config is CheckInConfigFields {
  if (typeof config !== "object" || config === null) {
    return false;
  }

  const c = config as Record<string, unknown>;

  const fields: (keyof CheckInConfigFields)[] = [
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

  return fields.every((field) => typeof c[field] === "boolean");
}

export async function POST(req: Request) {
  try {
    const body: UpdateCheckInConfigBody = await req.json();

    const { config } = body;

    if (!validateConfig(config)) {
      return NextResponse.json(
        {
          success: false,
          message: "invalid config",
        },
        {
          status: 400,
        },
      );
    }

    const client = await clientPromise;

    const db = client.db("attendance");

    const checkIn = db.collection<CheckInConfigDocument>("checkIn");

    const safeConfig = {
      ...defaultConfig,

      ...config,
    };

    await checkIn.updateOne(
      {
        type: "global_config",
      },
      {
        $set: {
          type: "global_config",
          config: safeConfig,
          updatedAt: new Date(),
        },
      },
      {
        upsert: true,
      },
    );

    return NextResponse.json({
      success: true,

      config: safeConfig,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Unknown error",
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET() {
  try {
    const client = await clientPromise;

    const db = client.db("attendance");

    const checkIn = db.collection<CheckInConfigDocument>("checkIn");

    const result = await checkIn.findOne({
      type: "global_config",
    });

    const config = result?.config
      ? {
          ...defaultConfig,
          ...result.config,
        }
      : defaultConfig;

    return NextResponse.json({
      success: true,

      config,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Unknown error",
      },
      {
        status: 500,
      },
    );
  }
}
