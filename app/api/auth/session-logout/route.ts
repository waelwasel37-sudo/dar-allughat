import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ status: "success" });
  
  // ✅ تم التعديل لحذف الكوكي الجديد باسم "session" بنجاح
  response.cookies.delete("session");
  
  return response;
}