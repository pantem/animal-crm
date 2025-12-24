import mongoose from 'mongoose';

const FeedingSchema = new mongoose.Schema({
    animalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Animal',
        required: [true, 'El animal es requerido']
    },
    foodType: {
        type: String,
        required: [true, 'El tipo de alimento es requerido'],
        trim: true
    },
    quantity: {
        type: Number,
        required: [true, 'La cantidad es requerida'],
        min: [0, 'La cantidad debe ser mayor o igual a 0']
    },
    unit: {
        type: String,
        enum: ['kg', 'lb', 'g', 'L'],
        default: 'kg'
    },
    date: {
        type: Date,
        required: [true, 'La fecha es requerida'],
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for efficient queries and aggregations
FeedingSchema.index({ animalId: 1 });
FeedingSchema.index({ date: -1 });
FeedingSchema.index({ foodType: 1 });
FeedingSchema.index({ animalId: 1, date: -1 });

// Static method to get total consumption for a date range
FeedingSchema.statics.getTotalConsumption = async function (startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$quantity' }
            }
        }
    ]);
};

// Static method to get daily consumption
FeedingSchema.statics.getDailyConsumption = async function (days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return this.aggregate([
        {
            $match: {
                date: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                total: { $sum: '$quantity' }
            }
        },
        { $sort: { _id: 1 } }
    ]);
};

export default mongoose.model('Feeding', FeedingSchema);
