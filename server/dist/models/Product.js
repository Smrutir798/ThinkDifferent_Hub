import mongoose from 'mongoose';
const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    key: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        required: true,
        default: 'Active',
    },
    description: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
export const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);
