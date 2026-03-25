import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { name, email, avatar, language, theme, country, timezone } = body;

    if (!name || !email) {
      return NextResponse.json(
        { message: 'Name and email are required.' },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: 'User not found.' },
        { status: 404 },
      );
    }

    if (email !== session.user.email) {
      const emailUsed = await prisma.user.findUnique({
        where: { email },
      });

      if (emailUsed) {
        return NextResponse.json(
          { message: 'This email is already in use.' },
          { status: 400 },
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        email,
        avatar,
        language,
        theme,
        country,
        timezone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        language: true,
        theme: true,
        country: true,
        timezone: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Profile updated successfully.',
        user: updatedUser,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('PUT /api/profile-page/edit error:', error);

    return NextResponse.json(
      { message: 'Failed to update profile.' },
      { status: 500 },
    );
  }
}