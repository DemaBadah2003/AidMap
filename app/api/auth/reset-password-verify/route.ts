import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const SAME_RESPONSE = {
  ok: true,
  message: 'If the link is valid, you may continue to reset your password.',
};

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token || typeof token !== 'string') {
    return NextResponse.json(SAME_RESPONSE, { status: 200 });
  }

  try {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
      },
    });

    const valid = !!(
      verificationToken && verificationToken.expires >= new Date()
    );

    if (!valid) {
      return NextResponse.json(SAME_RESPONSE, { status: 200 });
    }

    return NextResponse.json(SAME_RESPONSE, { status: 200 });
  } catch {
    return NextResponse.json(SAME_RESPONSE, { status: 200 });
  }
}