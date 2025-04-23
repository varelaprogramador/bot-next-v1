import { NextResponse } from "next/server";

export const GET = async () => {
  return NextResponse.json({ success: true }, { status: 200 });
};

export const POST = async () => {
  return NextResponse.json({ success: true }, { status: 200 });
};
