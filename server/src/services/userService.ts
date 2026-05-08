import { UserRepository } from '../repositories/userRepository';
import bcrypt from 'bcryptjs';
import { AppError } from '../middlewares/errorHandler';
import { Prisma, Role, User } from '@prisma/client';

export type UserCreateInput = Pick<Prisma.UserUncheckedCreateInput, 'email' | 'password' | 'role'>;
export type UserUpdateInput = Prisma.UserUpdateInput;

export class UserService {
  private userRepository = new UserRepository();

  async getUsers(orgId: string) {
    return this.userRepository.findAll(orgId);
  }

  async createUser(orgId: string, data: UserCreateInput) {
    const { email, password, role } = data;
    
    // Check if user exists
    const users = await this.userRepository.findAll(orgId);
    if (users.find(u => u.email === email)) {
      throw new AppError(400, 'User with this email already exists in your organization');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.userRepository.create({
      email,
      password: hashedPassword,
      role: role || Role.USER,
      organizationId: orgId,
    });
  }

  async updateUser(id: string, orgId: string, data: UserUpdateInput) {
    return this.userRepository.update(id, orgId, data);
  }

  async deleteUser(id: string, orgId: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new AppError(400, 'You cannot delete yourself');
    }
    return this.userRepository.delete(id, orgId);
  }
}
