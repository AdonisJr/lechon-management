import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/mongodb';
import LechonSlot from '@/app/models/LechonSlot';
import jwt from 'jsonwebtoken';

// GET /api/lechon_slot/[id] - Get a specific lechon slot
export async function GET(request, { params }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    await connectToDatabase();

    const { id } = await params;
    const slot = await LechonSlot.findById(id)
        .populate('currentOrders', '_id');

    if (!slot) {
      return NextResponse.json({ error: 'Lechon slot not found' }, { status: 404 });
    }

    return NextResponse.json({ slot });
  } catch (error) {
    console.error('Get lechon slot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/lechon_slot/[id] - Update a lechon slot
export async function PUT(request, { params }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    await connectToDatabase();

    const { id } = await params;
    const updateData = await request.json();

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;

    const updatedSlot = await LechonSlot.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    ).populate('currentOrders', '_id');

    if (!updatedSlot) {
      return NextResponse.json({ error: 'Lechon slot not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Lechon slot updated successfully',
      slot: updatedSlot
    });
  } catch (error) {
    console.error('Update lechon slot error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/lechon_slot/[id] - Delete a lechon slot
export async function DELETE(request, { params }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    await connectToDatabase();

    const { id } = await params;
    const deletedSlot = await LechonSlot.findByIdAndDelete(id);

    if (!deletedSlot) {
      return NextResponse.json({ error: 'Lechon slot not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lechon slot deleted successfully' });
  } catch (error) {
    console.error('Delete lechon slot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}