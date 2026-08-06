import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("attendance")

    const collections = await db.listCollections().toArray()

    return Response.json({
      success: true,
      message: "Connected to MongoDB",
      collections,
    })
  } catch (error) {
    return Response.json({
      success: false,
      error: (error as Error).message,
    })
  }
}