import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/mongodb';
import Order from '@/app/models/Order';

// Simple test endpoint to verify orders API is working
export async function GET() {
  try {
    await connectToDatabase();

    // Try to fetch orders with basic population
    const orders = await Order.find({})
      .populate('createdBy', 'name email')
      .populate({
        path: 'slotId',
        select: 'name status type capacity currentOrders',
        model: 'LechonSlot',
        populate: {
          path: 'currentOrders',
          select: '_id'
        }
      })
      .limit(5); // Just get first 5 for testing

    return NextResponse.json({
      success: true,
      message: 'Orders API is working',
      count: orders.length,
      orders: orders.map(order => ({
        id: order._id,
        customerName: order.customerName,
        status: order.status,
        slotId: order.slotId ? {
          name: order.slotId.name,
          status: order.slotId.status,
          availableCapacity: order.slotId.availableCapacity
        } : null
      }))
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}