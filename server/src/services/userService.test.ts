import { UserService } from './userService';
import { UserRepository } from '../repositories/userRepository';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

jest.mock('../repositories/userRepository');
jest.mock('bcryptjs');

describe('UserService', () => {
  let userService: UserService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepository = new UserRepository() as any;
    userService = new UserService();
    (userService as any).userRepository = userRepository;
  });

  it('should create a new user with hashed password', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      role: Role.USER
    };

    userRepository.findAll.mockResolvedValue([]);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    userRepository.create.mockResolvedValue({ id: '1', ...userData, password: 'hashed_password', organizationId: 'org-1' } as any);

    const result = await userService.createUser('org-1', userData);

    expect(result).toHaveProperty('id');
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(userRepository.create).toHaveBeenCalledWith({
      email: userData.email,
      password: 'hashed_password',
      role: Role.USER,
      organizationId: 'org-1'
    });
  });

  it('should throw error if user already exists', async () => {
    userRepository.findAll.mockResolvedValue([{ email: 'test@example.com' }] as any);

    await expect(userService.createUser('org-1', { email: 'test@example.com', password: 'p' }))
      .rejects.toThrow('User with this email already exists in your organization');
  });
});
