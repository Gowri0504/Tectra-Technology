import { AuthService } from './authService';
import { AuthRepository } from '../repositories/authRepository';

jest.mock('../repositories/authRepository');

describe('AuthService', () => {
  let authService: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    authRepository = new AuthRepository() as any;
    authService = new AuthService();
    (authService as any).authRepository = authRepository;
  });

  it('should throw error if user already exists', async () => {
    authRepository.findUserByEmail.mockResolvedValue({ id: '1' } as any);
    
    await expect(authService.register('test@test.com', 'pass', 'org'))
      .rejects.toThrow('User already exists');
  });

  it('should generate tokens on successful login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      password: await require('bcryptjs').hash('pass', 10),
      organizationId: 'org1',
      role: 'ADMIN',
      loginAttempts: 0,
    };
    
    authRepository.findUserByEmail.mockResolvedValue(mockUser as any);
    authRepository.updateUser.mockResolvedValue(mockUser as any);
    authRepository.createRefreshToken.mockResolvedValue({} as any);

    const result = await authService.login('test@test.com', 'pass');
    
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });
});
