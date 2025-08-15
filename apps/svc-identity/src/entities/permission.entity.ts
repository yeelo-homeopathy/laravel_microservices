import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, Index } from "typeorm"
import { IsString, IsOptional, IsBoolean } from "class-validator"

import { Role } from "./role.entity"

/**
 * Permission Entity
 *
 * Represents individual permissions in the RBAC system.
 * Permissions define what actions users can perform.
 *
 * Features:
 * - Hierarchical permission structure
 * - Resource-based permissions
 * - System vs custom permissions
 * - Permission grouping
 */

@Entity("permissions")
@Index(["name"])
@Index(["resource"])
@Index(["action"])
@Index(["isSystem"])
export class Permission {
  @PrimaryGeneratedColumn("uuid")
  id: string

  // ==========================================================================
  // BASIC INFORMATION
  // ==========================================================================

  @Column({ unique: true, length: 100 })
  @IsString()
  name: string // e.g., 'users.create', 'orders.read'

  @Column({ length: 100 })
  @IsString()
  displayName: string

  @Column({ length: 500, nullable: true })
  @IsOptional()
  @IsString()
  description?: string

  // ==========================================================================
  // PERMISSION STRUCTURE
  // ==========================================================================

  @Column({ length: 50 })
  @IsString()
  resource: string // e.g., 'users', 'orders', 'products'

  @Column({ length: 50 })
  @IsString()
  action: string // e.g., 'create', 'read', 'update', 'delete'

  @Column({ length: 50, nullable: true })
  @IsOptional()
  @IsString()
  scope?: string // e.g., 'own', 'all', 'department'

  // ==========================================================================
  // PERMISSION PROPERTIES
  // ==========================================================================

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean

  @Column({ default: false })
  @IsBoolean()
  isSystem: boolean // System permissions cannot be deleted

  @Column({ nullable: true, length: 50 })
  @IsOptional()
  @IsString()
  category?: string // For grouping permissions in UI

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
    () => Role,
    (role) => role.permissions,
  )
  roles: Role[]

  // ==========================================================================
  // METHODS
  // ==========================================================================

  /**
   * Get full permission identifier
   */
  getFullName(): string {
    return this.scope ? `${this.resource}.${this.action}.${this.scope}` : `${this.resource}.${this.action}`
  }

  /**
   * Check if permission is editable (not system permission)
   */
  isEditable(): boolean {
    return !this.isSystem
  }

  /**
   * Check if permission can be deleted
   */
  isDeletable(): boolean {
    return !this.isSystem
  }
}
