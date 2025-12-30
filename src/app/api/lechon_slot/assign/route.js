import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/mongodb';
import LechonSlot from '@/app/models/LechonSlot';
import Order from '@/app/models/Order';
import jwt from 'jsonwebtoken';

/* =====================================================
   POST /api/lechon_slot/assign
   Assign an order to a slot + start cooking
===================================================== */
export async function POST(request) {
  try {
    // ---- AUTH ----
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    await connectToDatabase();

    const { slotId, orderId } = await request.json();
    if (!slotId || !orderId) {
      return NextResponse.json(
        { error: 'Slot ID and Order ID are required' },
        { status: 400 }
      );
    }

    const slot = await LechonSlot.findById(slotId);
    const order = await Order.findById(orderId);

    if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (!slot.canAcceptOrders) {
      return NextResponse.json(
        { error: 'Slot is at full capacity or not available' },
        { status: 400 }
      );
    }

    if (order.slotId) {
      return NextResponse.json(
        { error: 'Order is already assigned to a slot' },
        { status: 400 }
      );
    }

    const now = new Date();

    // ---- UPDATE SLOT ----
    const updatedSlot = await LechonSlot.findByIdAndUpdate(
      slotId,
      {
        $push: {
          currentOrders: orderId,
          history: {
            orderId,
            startCooking: now,
            endCooking: null,
          },
        },
      },
      { new: true }
    );

    // ---- SLOT STATUS ----
    const newStatus =
      updatedSlot.currentOrders.length >= updatedSlot.capacity
        ? 'occupied'
        : 'available';

    if (updatedSlot.status !== newStatus) {
      await LechonSlot.findByIdAndUpdate(slotId, { status: newStatus });
    }

    // ---- UPDATE ORDER ----
    await Order.findByIdAndUpdate(orderId, {
      slotId,
      status: 'cooking',
      cooking_date: now,   // ✅ ADDED
      cooked_date: null,   // reset if reassigned
    });

    return NextResponse.json({
      message: 'Order assigned to slot and cooking started',
    });
  } catch (error) {
    console.error('Assign order to slot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* =====================================================
   DELETE /api/lechon_slot/assign
   Unassign order + end cooking
===================================================== */
export async function DELETE(request) {
  try {
    // ---- AUTH ----
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (!order.slotId) {
      return NextResponse.json(
        { error: 'Order is not assigned to any slot' },
        { status: 400 }
      );
    }

    const now = new Date();

    // ---- REMOVE ORDER FROM SLOT ----
    const updatedSlot = await LechonSlot.findByIdAndUpdate(
      order.slotId,
      { $pull: { currentOrders: orderId } },
      { new: true }
    );

    // ---- UPDATE HISTORY (END COOKING) ----
    await LechonSlot.updateOne(
      { _id: order.slotId, 'history.orderId': orderId, 'history.endCooking': null },
      { $set: { 'history.$.endCooking': now } }
    );

    // ---- SLOT STATUS ----
    const newStatus =
      updatedSlot.currentOrders.length >= updatedSlot.capacity
        ? 'occupied'
        : 'available';

    if (updatedSlot.status !== newStatus) {
      await LechonSlot.findByIdAndUpdate(order.slotId, { status: newStatus });
    }

    // ---- UPDATE ORDER ----
    await Order.findByIdAndUpdate(orderId, {
      slotId: null,
      status: 'cooked',
      cooked_date: now, // ✅ ADDED
    });

    return NextResponse.json({
      message: 'Order unassigned, cooking ended, order cooked',
    });
  } catch (error) {
    console.error('Unassign order from slot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
