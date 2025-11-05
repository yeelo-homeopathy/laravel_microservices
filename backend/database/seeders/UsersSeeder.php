<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@homeopathy.com',
            'password' => Hash::make('password123'),
            'phone' => '9876543210',
            'role' => 'admin',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Manager User',
            'email' => 'manager@homeopathy.com',
            'password' => Hash::make('password123'),
            'phone' => '9876543211',
            'role' => 'manager',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Staff User',
            'email' => 'staff@homeopathy.com',
            'password' => Hash::make('password123'),
            'phone' => '9876543212',
            'role' => 'staff',
            'is_active' => true,
        ]);
    }
}
