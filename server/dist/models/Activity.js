import mongoose from 'mongoose';
const ActivitySchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        default: 'system',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
export const ActivityModel = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
