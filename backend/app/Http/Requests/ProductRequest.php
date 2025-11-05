<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:products,sku,' . $this->product?->id,
            'brand_id' => 'required|exists:brands,id',
            'category' => 'required|string|max:100',
            'potency' => 'nullable|string|max:50',
            'therapeutic_use' => 'nullable|string|max:255',
            'cost_price' => 'required|numeric|min:0',
            'margin_percent' => 'required|numeric|min:0|max:100',
            'hsn_code' => 'required|string|max:10',
            'tax_rate' => 'required|numeric|min:0|max:100',
            'reorder_level' => 'required|integer|min:1',
            'is_active' => 'boolean',
        ];
    }
}
