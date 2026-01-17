const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // snapshot harga ketika user beli
        seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } //  id deller 
    }],
    shippingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        province: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, default: 'Indonesia' },
        addressNotes: { type: String }
    },

    uniqueCode: {
        type: String,
        required: true,
        unique: true
    },
    paymentProof: {
        type: String, 
        default: null
    },
    itemsPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },

    isPaid: {
        type: Boolean,
        required: true,
        default: false,
    },
    paidAt: {
        type: Date,
    },

    isDelivered: {
        type: Boolean,
        required: true,
        default: false,
    },
    deliveredAt: {
        type: Date,
    },

    resiOrder: {
        type: String,
        default: null
    },
    courier: {
        type: String,
        default: null },

    status: {
        type: String,
        enum: [
            'pending_payment',      
            'waiting_verification', 
            'processed',           
            'rejected',
            'packing',
            'sent',                 
            'completed',
            'rejected'
        ],
        default: 'pending_payment'
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);