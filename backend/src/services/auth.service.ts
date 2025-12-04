import prisma from '../utils/prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { 
  UnauthorizedError, 
  ConflictError, 
  NotFoundError,
  BadRequestError 
} from '../utils/errors';
import { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput } from '../schemas';
import crypto from 'crypto';

export const authService = {

  //----------------------------------
  // REGISTER
  //----------------------------------
  async register(data: RegisterInput) {

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user (correct field: passwordHash, NOT password)
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name ?? null,
        passwordHash: passwordHash,
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Issue JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  },

  //----------------------------------
  // LOGIN
  //----------------------------------
  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await comparePassword(data.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  },

  //----------------------------------
  // GET PROFILE
  //----------------------------------
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  },

  //----------------------------------
  // UPDATE PROFILE
  //----------------------------------
  async updateProfile(userId: string, data: UpdateProfileInput) {
    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: data.email.toLowerCase(),
          NOT: { id: userId },
        },
      });

      if (existing) {
        throw new ConflictError('Email already in use');
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email.toLowerCase() }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  },

  //----------------------------------
  // CHANGE PASSWORD
  //----------------------------------
  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.passwordHash) {
      throw new NotFoundError('User not found');
    }

    const valid = await comparePassword(data.currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const newHash = await hashPassword(data.newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { success: true };
  },

  //----------------------------------
  // FORGOT PASSWORD
  //----------------------------------
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) return { success: true };

    const token = crypto.randomBytes(32).toString('hex');

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`Reset token for ${email}: ${token}`);
    }

    return { success: true };
  },

  //----------------------------------
  // RESET PASSWORD
  //----------------------------------
  async resetPassword(token: string, newPassword: string) {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const hash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: hash },
    });

    await prisma.passwordResetToken.delete({
      where: { id: record.id },
    });

    return { success: true };
  },
};

export default authService;

