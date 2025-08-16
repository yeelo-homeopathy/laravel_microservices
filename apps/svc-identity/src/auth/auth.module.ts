import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"
import { ConfigModule, ConfigService } from "@nestjs/config"

import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { JwtStrategy } from "./strategies/jwt.strategy"
import { LocalStrategy } from "./strategies/local.strategy"
import { GoogleStrategy } from "./strategies/google.strategy"
import { FacebookStrategy } from "./strategies/facebook.strategy"

import { User } from "../entities/user.entity"
import { UserSession } from "../entities/user-session.entity"
import { UserLoginAttempt } from "../entities/user-login-attempt.entity"
import { Role } from "../entities/role.entity"

import { UsersModule } from "../users/users.module"
import { EmailModule } from "../email/email.module"
import { KafkaModule } from "../kafka/kafka.module"

/**
 * Authentication Module
 *
 * Handles user authentication, authorization, and session management.
 * Supports local authentication, JWT tokens, and OAuth2 providers.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSession, UserLoginAttempt, Role]),

    // JWT Configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("auth.jwt.secret"),
        signOptions: {
          expiresIn: configService.get<string>("auth.jwt.expiresIn"),
          issuer: configService.get<string>("auth.jwt.issuer"),
          audience: configService.get<string>("auth.jwt.audience"),
        },
      }),
      inject: [ConfigService],
    }),

    // Passport Configuration
    PassportModule.register({
      defaultStrategy: "jwt",
      property: "user",
      session: false,
    }),

    // Feature Modules
    UsersModule,
    EmailModule,
    KafkaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, GoogleStrategy, FacebookStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
