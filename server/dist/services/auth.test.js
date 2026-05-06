"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authService_1 = require("./authService");
const authRepository_1 = require("../repositories/authRepository");
jest.mock('../config/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        organization: {
            create: jest.fn(),
        },
        refreshToken: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback({})),
    },
}));
jest.mock('../repositories/authRepository');
jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));
describe('AuthService', () => {
    let authService;
    let authRepository;
    beforeEach(() => {
        authRepository = new authRepository_1.AuthRepository();
        authService = new authService_1.AuthService();
        authService.authRepository = authRepository;
    });
    it('should throw error if user already exists', async () => {
        authRepository.findUserByEmail.mockResolvedValue({ id: '1' });
        await expect(authService.register('test@test.com', 'pass', 'org'))
            .rejects.toThrow('User already exists');
    });
    it('should generate tokens on successful login', async () => {
        const mockUser = {
            id: '1',
            email: 'test@test.com',
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            password: await require('bcryptjs').hash('pass', 10),
            organizationId: 'org1',
            role: 'ADMIN',
            loginAttempts: 0,
        };
        authRepository.findUserByEmail.mockResolvedValue(mockUser);
        authRepository.updateUser.mockResolvedValue(mockUser);
        authRepository.createRefreshToken.mockResolvedValue({});
        const result = await authService.login('test@test.com', 'pass');
        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('refreshToken');
    });
});
