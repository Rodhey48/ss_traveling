import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginUserDTO, RegisterUserDTO } from '../dto/auth.dto';
import { RolesEntity, UserRolesEntity, UsersEntity } from '../../@models';
import { BcryptService } from '../../@services/bcrypt/bcrypt.service';
import { JWTService } from '../../@services/jwt/jwt.service';
import { ResponseInterface, UserLoggedInterface } from '../../@interfaces';
import { INTERNAL_SERVER_ERROR_MESSAGE } from '../../@common';
import { MenusService } from '../../@services/menus/menus.service';
import * as crypto from 'crypto';
import { Response } from 'express';

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
    foundUser.isPasswordChanged = false;

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

  async login(payload: LoginUserDTO, res: Response): Promise<any> {
    try {
      const foundUser = await this.userRepo
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'roles', 'roles.isActive = true')
        .leftJoinAndSelect('roles.role', 'role', 'role.isActive = true')
        .leftJoinAndSelect('role.menus', 'menus', 'menus.isActive = true')
        .leftJoinAndSelect('menus.menu', 'menu', 'menu.isActive = true')
        .where(
          '(user.isActive = true AND user.email = :identifier) OR (user.isActive = true AND user.nip = :identifier)',
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

      const roleIds = foundUser.roles.map((ur) => ur.role.id);
      const roles = foundUser.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
      }));
      const menus = await this.menusService.findMenusByRole(roleIds);

      const tokenLogin = crypto
        .randomBytes(15)
        .toString('hex')
        .substring(0, 20);

      const userData: UserLoggedInterface = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        nip: foundUser.nip,
        role: roles,
        token: tokenLogin,
      };

      const token = this.jwtService.createToken(userData);

      foundUser.token = tokenLogin;
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
            roles,
          },
          token,
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
}
