import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/mongodb';
import Order from '@/app/models/Order';
import User from '@/app/models/User';
import jwt from 'jsonwebtoken';

// GET /api/orders - Get all orders for the authenticated admin
export async function GET(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    await connectToDatabase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    
    // Build filter object
    const filter = {};

    // Search parameters (partial match)
    const search = searchParams.get('search');
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { numberKilos: isNaN(search) ? undefined : parseFloat(search) }
      ].filter(Boolean);
    }

    // Individual search fields
    const firstName = searchParams.get('firstName');
    if (firstName) {
      filter.firstName = { $regex: firstName, $options: 'i' };
    }

    const lastName = searchParams.get('lastName');
    if (lastName) {
      filter.lastName = { $regex: lastName, $options: 'i' };
    }

    const code = searchParams.get('code');
    if (code) {
      filter.code = { $regex: code, $options: 'i' };
    }

    const numberKilos = searchParams.get('numberKilos');
    if (numberKilos && !isNaN(numberKilos)) {
      filter.numberKilos = parseFloat(numberKilos);
    }

    // Filter parameters (exact match)
    const typeOrder = searchParams.get('typeOrder');
    if (typeOrder) {
      filter.typeOrder = typeOrder;
    }

    const type = searchParams.get('type');
    if (type) {
      filter.type = type;
    }

    const status = searchParams.get('status');
    if (status) {
      filter.status = status;
    }

    // Date filters
    const dateReceived = searchParams.get('dateReceived');
    if (dateReceived) {
      const startDate = new Date(dateReceived);
      const endDate = new Date(dateReceived);
      endDate.setDate(endDate.getDate() + 1);
      filter.dateReceived = { $gte: startDate, $lt: endDate };
    }

    const dateCooked = searchParams.get('dateCooked');
    if (dateCooked) {
      const startDate = new Date(dateCooked);
      const endDate = new Date(dateCooked);
      endDate.setDate(endDate.getDate() + 1);
      filter.dateCooked = { $gte: startDate, $lt: endDate };
    }

    // Time filters (if date is also provided, combine them)
    const timeReceived = searchParams.get('timeReceived');
    if (timeReceived) {
      if (dateReceived) {
        // If date is provided, combine date and time
        const dateTime = new Date(`${dateReceived}T${timeReceived}`);
        const nextMinute = new Date(dateTime);
        nextMinute.setMinutes(nextMinute.getMinutes() + 1);
        filter.dateReceived = { $gte: dateTime, $lt: nextMinute };
      } else {
        // Just filter by time component (this is more complex)
        // For simplicity, we'll skip time-only filtering without date
        console.warn('timeReceived filter requires dateReceived to be effective');
      }
    }

    const timeCooked = searchParams.get('timeCooked');
    if (timeCooked) {
      if (dateCooked) {
        // If date is provided, combine date and time
        const dateTime = new Date(`${dateCooked}T${timeCooked}`);
        const nextMinute = new Date(dateTime);
        nextMinute.setMinutes(nextMinute.getMinutes() + 1);
        filter.dateCooked = { $gte: dateTime, $lt: nextMinute };
      } else {
        // Just filter by time component (this is more complex)
        console.warn('timeCooked filter requires dateCooked to be effective');
      }
    }

    // Get orders with filters, sorted by creation date (newest first)
    const orders = await Order.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/orders - Create a new order
export async function POST(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    await connectToDatabase();

    const {
      code,
      firstName,
      lastName,
      typeOrder,
      type,
      numberKilos,
      price,
      downPayment,
      isPaid,
      dateReceived,
      timeReceived,
      dateCooked,
      timeCooked,
      specialInstructions,
      status
    } = await request.json();

    // Validate required fields
    if (!code || !firstName || !lastName || !typeOrder || !type || !numberKilos || !price || !dateReceived || !timeReceived || !dateCooked || !timeCooked) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if order code already exists
    const existingOrder = await Order.findOne({ code: code.toUpperCase() });
    if (existingOrder) {
      return NextResponse.json({ error: 'Order code already exists' }, { status: 400 });
    }

    // Create new order
    const newOrder = await Order.create({
      code: code.toUpperCase(),
      firstName,
      lastName,
      typeOrder,
      type,
      numberKilos,
      price,
      downPayment: downPayment || 0,
      isPaid: isPaid || false,
      dateReceived: new Date(dateReceived),
      timeReceived,
      dateCooked: new Date(dateCooked),
      timeCooked,
      specialInstructions,
      status: status || 'pending',
      createdBy: decoded.userId,
    });

    const populatedOrder = await Order.findById(newOrder._id).populate('createdBy', 'name email');

    return NextResponse.json({
      message: 'Order created successfully',
      order: populatedOrder
    }, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }

    if (error.code === 11000) {
      return NextResponse.json({ error: 'Order code already exists' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}