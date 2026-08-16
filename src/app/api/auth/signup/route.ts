import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword } = body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user - Force role to USER
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'USER',
        buyingPower: 500000.0, // Default virtual capital
      },
    });

    // Create wallet for new user
    await prisma.wallet.create({
      data: {
        userId: newUser.id,
        availableBalance: 500000.0,
        reservedBalance: 0,
        usedMargin: 0,
        totalBalance: 500000.0,
        transactions: {
          create: [
            {
              type: 'DEPOSIT',
              amount: 500000.0,
              description: 'Initial Virtual Account Capital',
            },
          ],
        },
      },
    });

    // Create empty portfolio
    await prisma.portfolio.create({
      data: {
        userId: newUser.id,
      },
    });

    // Generate JWT & Set Cookie
    const token = await signToken({ userId: newUser.id, role: newUser.role });
    await setAuthCookie(token);

    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
