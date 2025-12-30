import mongoose from 'mongoose';

const LechonSlotSchema = new mongoose.Schema({
    history: [
        {
            orderId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Order',
            },
            startCooking: Date,
            endCooking: Date,
        }
    ],
    name: {
        type: String,
        required: [true, 'Please provide slot name'],
        unique: true,
        maxlength: [50, 'Slot name cannot be more than 50 characters'],
    },
    status: {
        type: String,
        enum: ['available', 'occupied', 'maintenance', 'out_of_order'],
        default: 'available',
    },
    capacity: {
        type: Number,
        default: 1,
        min: [1, 'Capacity must be at least 1'],
    },
    currentOrders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    }],
    type: {
        type: String,
        enum: ['whole_pig', 'chicken', 'pig_belly', 'whole_cow', 'multi_purpose'],
        default: 'multi_purpose',
    },
    notes: {
        type: String,
        maxlength: [200, 'Notes cannot exceed 200 characters'],
    },
    cooking_date: Date,
    cooked_date: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update the updatedAt field before saving
LechonSlotSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Index for faster queries
LechonSlotSchema.index({ name: 1 });
LechonSlotSchema.index({ status: 1 });
LechonSlotSchema.index({ type: 1 });

// Virtual to check if slot can accept more orders
LechonSlotSchema.virtual('canAcceptOrders').get(function () {
    return this.status === 'available' && this.currentOrders.length < this.capacity;
});

// Virtual to get available capacity
LechonSlotSchema.virtual('availableCapacity').get(function () {
    return Math.max(0, this.capacity - this.currentOrders.length);
});

// Ensure virtual fields are serialized
LechonSlotSchema.set('toJSON', { virtuals: true });
LechonSlotSchema.set('toObject', { virtuals: true });

// Check if model already exists to prevent re-compilation
const LechonSlot = mongoose.models.LechonSlot || mongoose.model('LechonSlot', LechonSlotSchema);

export default LechonSlot;