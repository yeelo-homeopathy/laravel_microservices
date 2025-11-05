<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\SalesOrder;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with('salesOrder');

        if ($request->sales_order_id) {
            $query->where('sales_order_id', $request->sales_order_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $payments = $query->latest()->paginate(15);

        return response()->json($payments);
    }

    public function recordPayment(Request $request, SalesOrder $salesOrder)
    {
        $request->validate([
            'payment_method' => 'required|in:cash,cheque,bank_transfer,online',
            'amount' => 'required|numeric|min:0.01',
            'transaction_id' => 'nullable|string|unique:payments',
            'payment_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $payment = Payment::create([
            'sales_order_id' => $salesOrder->id,
            'payment_method' => $request->payment_method,
            'amount' => $request->amount,
            'transaction_id' => $request->transaction_id,
            'payment_date' => $request->payment_date,
            'status' => 'completed',
            'notes' => $request->notes,
        ]);

        // Update payment status
        $totalPaid = $salesOrder->payments()->sum('amount');
        if ($totalPaid >= $salesOrder->grand_total) {
            $salesOrder->update(['payment_status' => 'paid']);
        } elseif ($totalPaid > 0) {
            $salesOrder->update(['payment_status' => 'partial']);
        }

        return response()->json($payment, 201);
    }

    public function show(Payment $payment)
    {
        return response()->json($payment->load('salesOrder'));
    }

    public function destroy(Payment $payment)
    {
        $payment->delete();

        return response()->json(['message' => 'Payment deleted']);
    }
}
