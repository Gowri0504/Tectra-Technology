import { UserRepository } from '../repositories/userRepository';
import { AuditRepository } from '../repositories/auditRepository';
import bcrypt from 'bcryptjs';
import { AppError } from '../middlewares/errorHandler';
import { Prisma, Role, User } from '@prisma/client';

export type UserCreateInput = Pick<Prisma.UserUncheckedCreateInput, 'email' | 'password' | 'role'>;
export type UserUpdateInput = Prisma.UserUpdateInput;

export class UserService {
  private userRepository = new UserRepository();
  private auditRepository = new AuditRepository();

  async getUsers(orgId: string) {
    return this.userRepository.findAll(orgId);
  }

  async createUser(orgId: string, data: UserCreateInput, currentUserId?: string) {
    const { email, password, role } = data;
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      role: role || Role.USER,
      organizationId: orgId,
    });

    await this.auditRepository.createLog({
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      organizationId: orgId,
      userId: currentUserId,
    });

    return user;
  }

  async updateUser(id: string, orgId: string, data: UserUpdateInput, currentUserId?: string) {
    const result = await this.userRepository.update(id, orgId, data);
    
    await this.auditRepository.createLog({
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      organizationId: orgId,
      userId: currentUserId,
    });

    return result;
  }

  async deleteUser(id: string, orgId: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new AppError(400, 'You cannot delete yourself');
    }
    const result = await this.userRepository.delete(id, orgId);

    await this.auditRepository.createLog({
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      organizationId: orgId,
      userId: currentUserId,
    });

    return result;
  }
}
