<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

/**
 * Role and Permission Seeder
 * 
 * Sets up the complete RBAC system for the e-commerce platform
 * with roles and permissions for different user types.
 */
class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // User management
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            
            // Role management
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            
            // Product management
            'products.view',
            'products.create',
            'products.edit',
            'products.delete',
            'products.publish',
            
            // Category management
            'categories.view',
            'categories.create',
            'categories.edit',
            'categories.delete',
            
            // Order management
            'orders.view',
            'orders.create',
            'orders.edit',
            'orders.delete',
            'orders.fulfill',
            'orders.cancel',
            
            // Inventory management
            'inventory.view',
            'inventory.edit',
            'inventory.adjust',
            
            // Payment management
            'payments.view',
            'payments.process',
            'payments.refund',
            
            // Seller management
            'sellers.view',
            'sellers.create',
            'sellers.edit',
            'sellers.approve',
            'sellers.suspend',
            
            // Customer support
            'support.view',
            'support.respond',
            'support.escalate',
            
            // Reports and analytics
            'reports.view',
            'reports.export',
            'analytics.view',
            
            // System administration
            'system.settings',
            'system.maintenance',
            'system.logs',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create roles and assign permissions
        
        // Super Admin - Full access
        $superAdmin = Role::create(['name' => 'super-admin']);
        $superAdmin->givePermissionTo(Permission::all());

        // Admin - Most permissions except system administration
        $admin = Role::create(['name' => 'admin']);
        $admin->givePermissionTo([
            'users.view', 'users.create', 'users.edit',
            'roles.view',
            'products.view', 'products.create', 'products.edit', 'products.delete', 'products.publish',
            'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
            'orders.view', 'orders.edit', 'orders.fulfill', 'orders.cancel',
            'inventory.view', 'inventory.edit', 'inventory.adjust',
            'payments.view', 'payments.process', 'payments.refund',
            'sellers.view', 'sellers.create', 'sellers.edit', 'sellers.approve', 'sellers.suspend',
            'support.view', 'support.respond', 'support.escalate',
            'reports.view', 'reports.export', 'analytics.view',
        ]);

        // Seller - Product and order management for their own items
        $seller = Role::create(['name' => 'seller']);
        $seller->givePermissionTo([
            'products.view', 'products.create', 'products.edit',
            'orders.view', 'orders.fulfill',
            'inventory.view', 'inventory.edit',
            'payments.view',
            'reports.view',
        ]);

        // Customer Support - Support and basic order management
        $support = Role::create(['name' => 'support']);
        $support->givePermissionTo([
            'users.view',
            'orders.view', 'orders.edit',
            'products.view',
            'support.view', 'support.respond',
            'reports.view',
        ]);

        // Customer - Basic customer permissions
        $customer = Role::create(['name' => 'customer']);
        $customer->givePermissionTo([
            'orders.view', 'orders.create',
            'products.view',
        ]);

        // Create default super admin user
        $superAdminUser = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@ecommerce.local',
            'password' => bcrypt('password'),
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
        $superAdminUser->assignRole('super-admin');

        // Create demo admin user
        $adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin.user@ecommerce.local',
            'password' => bcrypt('password'),
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
        $adminUser->assignRole('admin');

        // Create demo seller user
        $sellerUser = User::create([
            'name' => 'Demo Seller',
            'email' => 'seller@ecommerce.local',
            'password' => bcrypt('password'),
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
        $sellerUser->assignRole('seller');

        // Create demo customer user
        $customerUser = User::create([
            'name' => 'Demo Customer',
            'email' => 'customer@ecommerce.local',
            'password' => bcrypt('password'),
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
        $customerUser->assignRole('customer');

        $this->command->info('Roles and permissions created successfully!');
        $this->command->info('Demo users created:');
        $this->command->info('- Super Admin: admin@ecommerce.local / password');
        $this->command->info('- Admin: admin.user@ecommerce.local / password');
        $this->command->info('- Seller: seller@ecommerce.local / password');
        $this->command->info('- Customer: customer@ecommerce.local / password');
    }
}
