import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    code: {
        type: String,
        required: false,
        unique: false,
        uppercase: true
    },
    firstName: {
        type: String,
        required: false,
        maxlength: [50, 'First name cannot be more than 50 characters'],
    },
    lastName: {
        type: String,
        required: [true, 'Please provide last name'],
        maxlength: [50, 'Last name cannot be more than 50 characters'],
    },
    typeOrder: {
        type: String,
        required: [true, 'Please specify order type'],
        enum: ['order', 'labor'],
        default: 'order',
    },
    type: {
        type: String,
        required: [true, 'Please specify lechon type'],
        enum: ['whole_pig', 'chicken', 'pig_belly', 'whole_cow'],
    },
    numberKilos: {
        type: Number,
        required: false,
        max: [100, 'Maximum weight is 100kg'],
    },
    price: {
        type: Number,
        required: false,
        min: [0, 'Price cannot be negative'],
    },
    downPayment: {
        type: Number,
        default: 0,
        min: [0, 'Down payment cannot be negative'],
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    dateReceived: {
        type: Date,
        required: [true, 'Please provide date received'],
    },
    timeReceived: {
        type: String,
        required: [true, 'Please provide time received'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format'],
    },
    dateCooked: {
        type: Date,
        required: [true, 'Please provide date cooked'],
    },
    timeCooked: {
        type: String,
        required: [true, 'Please provide time cooked'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format'],
    },
    specialInstructions: {
        type: String,
        maxlength: [500, 'Special instructions cannot exceed 500 characters'],
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'cooking', 'packed', 'picked_up', 'ready', 'delivered', 'cancelled'],
        default: 'pending',
    },
    slotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LechonSlot',
        default: null,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
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
OrderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Index for faster queries
OrderSchema.index({ code: 1 });
OrderSchema.index({ firstName: 1, lastName: 1 });
OrderSchema.index({ typeOrder: 1 });
OrderSchema.index({ type: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ dateReceived: 1 });
OrderSchema.index({ dateCooked: 1 });
OrderSchema.index({ createdBy: 1 });

// Virtual for full name
OrderSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for formatted dates
OrderSchema.virtual('formattedDateReceived').get(function () {
    return this.dateReceived ? this.dateReceived.toLocaleDateString() : null;
});

OrderSchema.virtual('formattedDateCooked').get(function () {
    return this.dateCooked ? this.dateCooked.toLocaleDateString() : null;
});

// Ensure virtual fields are serialized
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

// Check if model already exists to prevent re-compilation
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

export default Order;