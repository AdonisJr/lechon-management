import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/mongodb';
import LechonSlot from '@/app/models/LechonSlot';
import jwt from 'jsonwebtoken';

// GET /api/lechon_slot - Get all lechon slots
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

        // Search parameters
        const search = searchParams.get('search');
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ].filter(Boolean);
        }

        // Filter parameters
        const status = searchParams.get('status');
        if (status) {
            filter.status = status;
        }

        const type = searchParams.get('type');
        if (type) {
            filter.type = type;
        }

        // Pagination
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 30;
        const skip = (page - 1) * limit;

        // Sorting
        const sortField = searchParams.get('sortField') || 'date';
        const sortDirection = searchParams.get('sortDirection') === 'desc' ? -1 : 1;

        const totalSlots = await LechonSlot.countDocuments(filter);
        const slots = await LechonSlot.find(filter)
            .populate('currentOrders', '_id firstName lastName code status dateCooked timeCooked kilos')
            .populate({
                path: 'history',
                select: 'startCooking endCooking notes',
                populate: {
                    path: 'orderId', // the field inside history that references Order
                    select: '_id firstName lastName code status dateCooked timeCooked kilos'
                }
            })
            .sort({ [sortField]: sortDirection })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalSlots / limit);

        return NextResponse.json({
            slots,
            pagination: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems: totalSlots,
                totalPages: totalPages
            }
        });
    } catch (error) {
        console.error('Get lechon slots error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/lechon_slot - Create a new lechon slot
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
            name,
            status,
            capacity,
            type,
            notes
        } = await request.json();

        // Validate required fields
        if (!name) {
            return NextResponse.json({ error: 'Slot name is required' }, { status: 400 });
        }

        // Create new slot
        const newSlot = await LechonSlot.create({
            name,
            status: status || 'available',
            capacity: capacity || 1,
            type: type || 'multi_purpose',
            notes,
        });

        return NextResponse.json({
            message: 'Lechon slot created successfully',
            slot: newSlot
        }, { status: 201 });
    } catch (error) {
        console.error('Create lechon slot error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
        }

        if (error.code === 11000) {
            return NextResponse.json({ error: 'Duplicate slot found' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}