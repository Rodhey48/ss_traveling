import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { INTERNAL_SERVER_ERROR_MESSAGE } from '../../@common';
import { ResponseInterface, UserLoggedInterface } from '../../@interfaces';
import { RolesEntity, UserRolesEntity, UsersEntity } from '../../@models';
import { BcryptService } from '../../@services/bcrypt/bcrypt.service';
import { JWTService } from '../../@services/jwt/jwt.service';
import { MenusService } from '../../menus/services/menus.service';
import { LoginUserDTO, RegisterUserDTO } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UsersEntity)
    private userRepo: Repository<UsersEntity>,
    @InjectRepository(UserRolesEntity)
    private userRoleRepo: Repository<UserRolesEntity>,
    @InjectRepository(RolesEntity)
    private roleRepo: Repository<RolesEntity>,
    private bcryptService: BcryptService,
    private jwtService: JWTService,
    private menusService: MenusService,
  ) {}

  /**
   * Register a new user
   * @param payload RegisterUserDTO
   * @returns Promise<ResponseInterface>
   */
  async register(payload: RegisterUserDTO): Promise<ResponseInterface> {
    const foundUser = await this.userRepo.findOne({
      where: { email: payload.email, nip: payload.nip },
    });

    if (!foundUser) {
      throw new NotFoundException({
        message: 'NIP or email not found',
        status: false,
      });
    }
    if (foundUser.isActive) {
      throw new ForbiddenException({
        message: 'User is already registered',
        status: false,
      });
    }

    foundUser.isActive = true;
    foundUser.password = await this.bcryptService.createHashPassword(
      payload.password,
    );
    foundUser.isPasswordChanged = true; // Registered with their own password

    const role = await this.roleRepo.findOne({ where: { name: 'Employee' } });
    if (!role) {
      throw new BadRequestException({
        message: 'Role Employee not found',
        status: false,
      });
    }

    try {
      const saveUser = await this.userRepo.save(foundUser);
      const userRole = new UserRolesEntity({ user: saveUser, role: role });
      await this.userRoleRepo.save(userRole);

      return {
        status: true,
        message: 'Success activate user',
        code: 201,
        data: { name: saveUser.name, email: saveUser.email, nip: saveUser.nip },
      };
    } catch (err) {
      this.logger.error(`Failed activate user: ${err}`);
      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR_MESSAGE);
    }
  }

  /**
   * Get user profile
   * @param userId string
   * @returns Promise<ResponseInterface>
   */
  async getMe(userId: string): Promise<ResponseInterface> {
    try {
      const foundUser = await this.userRepo
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'roles', 'roles.isActive = true')
        .leftJoinAndSelect('roles.role', 'role', 'role.isActive = true')
        .where('user.id = :userId AND user.isActive = true', { userId })
        .getOne();

      if (!foundUser) {
        throw new NotFoundException({
          message: 'User not found',
          status: false,
        });
      }

      const roles = foundUser.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
      }));
      const roleIds = foundUser.roles.map((ur) => ur.role.id);
      const menus = await this.menusService.findMenusByRole(roleIds);

      return {
        status: true,
        message: 'Profile fetched successfully',
        data: {
          user: {
            name: foundUser.name,
            id: foundUser.id,
            email: foundUser.email,
            nip: foundUser.nip,
            phone: foundUser.phone,
            avatar: foundUser.avatar,
            isPasswordChanged: foundUser.isPasswordChanged,
            roles,
          },
          menus,
        },
      };
    } catch (error) {
      this.logger.error(`GetMe error: ${error.message}`);
      throw new InternalServerErrorException(INTERNAL_SERVER_ERROR_MESSAGE);
    }
  }

  /**
   * Login user
   * @param payload LoginUserDTO
   * @param res Response
   * @param userAgent string
   * @returns Promise<any>
   */
  async login(
    payload: LoginUserDTO,
    res: Response,
    userAgent: string,
  ): Promise<any> {
    try {
      const foundUser = await this.userRepo
        .createQueryBuilder('user')
        .addSelect('user.password') // Kita butuh password untuk verifikasi
        .leftJoinAndSelect('user.roles', 'roles', 'roles.isActive = true')
        .leftJoinAndSelect('roles.role', 'role', 'role.isActive = true')
        .where(
          '((user.isActive = true AND user.email = :identifier) OR (user.isActive = true AND user.nip = :identifier))',
          {
            identifier: payload.identifier,
          },
        )
        .getOne();

      if (!foundUser) {
        throw new NotFoundException({
          message: 'Email or password not found',
          status: false,
        });
      }

      const passwordMatch = await this.bcryptService.checkPassword(
        payload.password,
        foundUser.password,
      );
      if (!passwordMatch) {
        throw new BadRequestException({
          message: 'Email or password is wrong',
          status: false,
        });
      }

      const roles = foundUser.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
      }));
      const roleIds = foundUser.roles.map((ur) => ur.role.id);
      const menus = await this.menusService.findMenusByRole(roleIds);
      const permissions =
        await this.menusService.getPermissionsByRoles(roleIds);

      // 1. Generate Session Token (UUID) & Fingerprint
      const sessionToken = crypto.randomUUID();
      const fingerprint = crypto
        .createHash('sha256')
        .update(payload.deviceId + userAgent)
        .digest('hex');

      const userData: UserLoggedInterface = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        nip: foundUser.nip,
        role: roles,
        permissions: permissions,
        sid: sessionToken,
        fingerprint: fingerprint, // Tambahkan fingerprint ke payload Access Token
      };

      // 2. Generate Tokens
      const accessToken = this.jwtService.createToken(userData);
      const refreshToken = this.jwtService.createRefreshToken({
        sid: sessionToken,
        fingerprint: fingerprint,
      });

      // 3. Update User Session & Device Info in DB
      foundUser.sessionToken = sessionToken;
      foundUser.refreshToken = refreshToken; // Kita simpan untuk validasi nanti
      foundUser.lastOrigin = fingerprint;
      foundUser.lastLogin = new Date();
      await this.userRepo.save(foundUser);

      return res.status(200).json({
        status: true,
        message: 'Login success',
        code: 200,
        data: {
          user: {
            name: foundUser.name,
            id: foundUser.id,
            email: foundUser.email,
            nip: foundUser.nip,
            phone: foundUser.phone,
            avatar: foundUser.avatar,
            isPasswordChanged: foundUser.isPasswordChanged,
            roles,
          },
          token: accessToken,
          refreshToken,
          menus,
        },
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Login error: ${error.message}`);
      throw new InternalServerErrorException({
        message: 'An error occurred during login',
        status: false,
      });
    }
  }

  /**
   * Refresh Token logic
   * @param oldRefreshToken string
   * @param deviceId string
   * @param userAgent string
   * @returns Promise<ResponseInterface>
   */
  async refreshToken(
    oldRefreshToken: string,
    deviceId: string,
    userAgent: string,
  ): Promise<ResponseInterface> {
    try {
      // 1. Verify Refresh Token signature & exp
      const payload: any = this.jwtService.verifyRefreshToken(oldRefreshToken);

      // 2. Find User by session ID (sid)
      const user = await this.userRepo
        .createQueryBuilder('user')
        .addSelect([
          'user.refreshToken',
          'user.sessionToken',
          'user.lastOrigin',
        ])
        .leftJoinAndSelect('user.roles', 'roles', 'roles.isActive = true')
        .leftJoinAndSelect('roles.role', 'role', 'role.isActive = true')
        .where('user.sessionToken = :sid AND user.isActive = true', {
          sid: payload.sid,
        })
        .getOne();

      if (!user) {
        throw new UnauthorizedException({ message: 'Invalid session' });
      }

      // 3. Validate Single Device & Origin Fingerprint
      const currentFingerprint = crypto
        .createHash('sha256')
        .update(deviceId + userAgent)
        .digest('hex');

      if (
        user.refreshToken !== oldRefreshToken ||
        user.lastOrigin !== currentFingerprint ||
        payload.fingerprint !== currentFingerprint
      ) {
        // Keamanan: Jika terdeteksi anomali, hapus sesi agar user harus login ulang
        user.sessionToken = null;
        user.refreshToken = null;
        await this.userRepo.save(user);
        throw new UnauthorizedException({
          message: 'Security anomaly detected',
        });
      }

      // 4. Generate New Session & Tokens (Update Permissions)
      const newSessionToken = crypto.randomUUID();
      const roleIds = user.roles.map((ur) => ur.role.id);
      const permissions =
        await this.menusService.getPermissionsByRoles(roleIds);

      const userData: UserLoggedInterface = {
        id: user.id,
        name: user.name,
        email: user.email,
        nip: user.nip,
        role: user.roles.map((ur) => ({ id: ur.role.id, name: ur.role.name })),
        permissions: permissions,
        sid: newSessionToken,
        fingerprint: currentFingerprint, // INI YANG TADI KURANG
      };

      const newAccessToken = this.jwtService.createToken(userData);
      const newRefreshToken = this.jwtService.createRefreshToken({
        sid: newSessionToken,
        fingerprint: currentFingerprint,
      });

      // 5. Save New Session to DB
      user.sessionToken = newSessionToken;
      user.refreshToken = newRefreshToken;
      await this.userRepo.save(user);

      return {
        status: true,
        message: 'Token refreshed successfully',
        data: {
          token: newAccessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error) {
      this.logger.error(`RefreshToken error: ${error.message}`);
      throw new UnauthorizedException({
        message: 'Session expired or invalid',
      });
    }
  }
}
