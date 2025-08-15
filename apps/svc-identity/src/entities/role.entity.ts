import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  Index,
} from "typeorm"
import { IsString, IsOptional, IsBoolean } from "class-validator"

import { User } from "./user.entity"
import { Permission } from "./permission.entity"

/**
 * Role Entity
 *
 * Represents user roles in the RBAC system.
 * Roles group permissions and can be assigned to users.
 *
 * Features:
 * - Hierarchical role structure
 * - Permission grouping
 * - System vs custom roles
 * - Audit trail
 */

@Entity("roles")
@Index(["name"])
@Index(["isSystem"])
@Index(["isActive"])
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id: string

  // ==========================================================================
  // BASIC INFORMATION
  // ==========================================================================

  @Column({ unique: true, length: 50 })
  @IsString()
  name: string

  @Column({ length: 100 })
  @IsString()
  displayName: string

  @Column({ length: 500, nullable: true })
  @IsOptional()
  @IsString()
  description?: string

  // ==========================================================================
  // ROLE PROPERTIES
  // ==========================================================================

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean

  @Column({ default: false })
  @IsBoolean()
  isSystem: boolean // System roles cannot be deleted

  @Column({ default: false })
  @IsBoolean()
  isDefault: boolean // Assigned to new users by default

  @Column({ nullable: true, length: 20 })
  @IsOptional()
  @IsString()
  color?: string // For UI display

  @Column({ nullable: true, length: 50 })
  @IsOptional()
  @IsString()
  icon?: string // For UI display

  // ==========================================================================
  // HIERARCHY
  // ==========================================================================

  @Column({ nullable: true })
  parentId?: string

  @Column({ default: 0 })
  level: number // Hierarchy level (0 = root)

  @Column({ default: 0 })
  sortOrder: number // Display order

  // ==========================================================================
  // TIMESTAMPS
  // ==========================================================================

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // ==========================================================================
  // RELATIONSHIPS
  // ==========================================================================

  @ManyToMany(
    () => User,
    (user) => user.roles,
  )
  users: User[]

  @ManyToMany(
    () => Permission,
    (permission) => permission.roles,
    { eager: true },
  )
  @JoinTable({
    name: "role_permissions",
    joinColumn: { name: "roleId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "permissionId", referencedColumnName: "id" },
  })
  permissions: Permission[]

  // ==========================================================================
  // METHODS
  // ==========================================================================

  /**
   * Check if role has specific permission
   */
  hasPermission(permissionName: string): boolean {
    return this.permissions?.some((permission) => permission.name === permissionName) || false
  }

  /**
   * Get all permission names for this role
   */
  getPermissionNames(): string[] {
    return this.permissions?.map((permission) => permission.name) || []
  }

  /**
   * Check if role is editable (not system role)
   */
  isEditable(): boolean {
    return !this.isSystem
  }

  /**
   * Check if role can be deleted
   */
  isDeletable(): boolean {
    return !this.isSystem && !this.isDefault
  }
}
