import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { UpdateUserDto, ChangePasswordDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  /**
   * Get user by ID
   */
  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatarUrl: true,
        bio: true,
        role: true,
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const { deletedAt, ...userWithoutDeletedAt } = user;
    return userWithoutDeletedAt;
  }

  /**
   * Get all users (Admin only with pagination)
   */
  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          avatarUrl: true,
          bio: true,
          role: true,
          verificationStatus: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser || existingUser.deletedAt) {
      throw new NotFoundException('User not found');
    }

    // CRITICAL: Protect verified user data - firstName, lastName, dateOfBirth are immutable after verification
    if (existingUser.verificationStatus === 'VERIFIED') {
      const protectedFields = ['firstName', 'lastName', 'dateOfBirth'];
      const attemptedChanges = protectedFields.filter(
        (field) => field in updateUserDto,
      );

      if (attemptedChanges.length > 0) {
        throw new ForbiddenException(
          `Cannot modify ${attemptedChanges.join(', ')} after verification. ` +
            'These fields are locked based on your verified ID document.',
        );
      }
    }

    // If email is being updated, check if it's already taken
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailExists) {
        throw new ConflictException('Email already in use');
      }

      // If email changed, reset verification status
      updateUserDto['verificationStatus'] = 'PENDING';
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatarUrl: true,
        bio: true,
        role: true,
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Send email notification about profile update (non-blocking)
    this.emailService
      .sendEmail({
        to: updatedUser.email,
        subject: '✅ Profile Updated Successfully',
        html: this.getProfileUpdateEmailTemplate(updatedUser.firstName),
      })
      .catch((error) => {
        console.error('Failed to send profile update email:', error);
      });

    return updatedUser;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      parseInt(this.configService.get('BCRYPT_ROUNDS') || '12'),
    );

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all refresh tokens
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Send email notification about password change (non-blocking)
    this.emailService
      .sendEmail({
        to: user.email,
        subject: '🔒 Password Changed Successfully',
        html: this.getPasswordChangeEmailTemplate(user.firstName),
      })
      .catch((error) => {
        console.error('Failed to send password change email:', error);
      });

    return { message: 'Password changed successfully. Please sign in again.' };
  }

  /**
   * Soft delete user account
   */
  async deleteAccount(
    userId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    // Users can only delete their own account unless they're admin
    if (userId !== requesterId && requesterRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own account');
    }

    // Soft delete user
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    // Delete all refresh tokens
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Send account deletion confirmation email (non-blocking)
    this.emailService
      .sendEmail({
        to: user.email,
        subject: "👋 Account Deleted - We're Sorry to See You Go",
        html: this.getAccountDeletionEmailTemplate(user.firstName),
      })
      .catch((error) => {
        console.error('Failed to send account deletion email:', error);
      });

    return { message: 'Account deleted successfully' };
  }

  /**
   * Update user role (Admin only)
   */
  async updateRole(userId: string, newRole: 'USER' | 'AGENT' | 'ADMIN') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Send email notification about role change (non-blocking)
    this.emailService
      .sendEmail({
        to: updatedUser.email,
        subject: '🎯 Your Account Role Has Been Updated',
        html: this.getRoleUpdateEmailTemplate(updatedUser.firstName, newRole),
      })
      .catch((error) => {
        console.error('Failed to send role update email:', error);
      });

    return updatedUser;
  }

  /**
   * Search users by name or email (Admin only)
   */
  async searchUsers(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          deletedAt: null,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          verificationStatus: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        query,
      },
    };
  }

  // Email Templates
  private getProfileUpdateEmailTemplate(name: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #667eea;">Profile Updated Successfully ✅</h2>
        <p>Hi ${name},</p>
        <p>Your profile has been updated successfully. If you didn't make this change, please contact our support team immediately.</p>
        <p>Best regards,<br>The Cribly Team</p>
      </div>
    `;
  }

  private getPasswordChangeEmailTemplate(name: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #667eea;">Password Changed Successfully 🔒</h2>
        <p>Hi ${name},</p>
        <p>Your password has been changed successfully. For security reasons, you've been logged out of all devices.</p>
        <p>If you didn't make this change, please contact our support team immediately.</p>
        <p>Best regards,<br>The Cribly Team</p>
      </div>
    `;
  }

  private getAccountDeletionEmailTemplate(name: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #667eea;">Account Deleted 👋</h2>
        <p>Hi ${name},</p>
        <p>Your Cribly account has been deleted successfully. We're sorry to see you go!</p>
        <p>If you change your mind, you can create a new account anytime.</p>
        <p>Thank you for being part of our community.</p>
        <p>Best regards,<br>The Cribly Team</p>
      </div>
    `;
  }

  private getRoleUpdateEmailTemplate(name: string, newRole: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #667eea;">Role Updated 🎯</h2>
        <p>Hi ${name},</p>
        <p>Your account role has been updated to: <strong>${newRole}</strong></p>
        <p>This change may affect your access to certain features. Please check your dashboard for more details.</p>
        <p>Best regards,<br>The Cribly Team</p>
      </div>
    `;
  }
}
