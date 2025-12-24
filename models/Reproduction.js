import mongoose from 'mongoose';

const HEAT_CYCLE_DAYS = 21;      // Default heat cycle for cattle
const GESTATION_DAYS = 114;      // Gestation period for calculating due date

const ReproductionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['heat', 'insemination'],
        required: [true, 'El tipo de registro es requerido']
    },
    animalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Animal',
        required: [true, 'El animal es requerido']
    },
    date: {
        type: Date,
        required: [true, 'La fecha es requerida'],
        default: Date.now
    },
    // Fields for 'heat' type
    intensity: {
        type: String,
        enum: ['low', 'medium', 'high', ''],
        default: ''
    },
    // Fields for 'insemination' type
    method: {
        type: String,
        enum: ['natural', 'artificial', ''],
        default: ''
    },
    sireCode: {
        type: String,  // Sire or semen straw code
        trim: true
    },
    result: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    technician: {
        type: String,  // Insemination technician
        trim: true
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for efficient queries
ReproductionSchema.index({ animalId: 1 });
ReproductionSchema.index({ type: 1 });
ReproductionSchema.index({ date: -1 });
ReproductionSchema.index({ type: 1, date: -1 });

// Virtual to calculate next heat date (only for heat type)
ReproductionSchema.virtual('nextHeatDate').get(function () {
    if (this.type !== 'heat' || !this.date) return null;
    const date = new Date(this.date);
    date.setDate(date.getDate() + HEAT_CYCLE_DAYS);
    return date;
});

// Virtual to calculate due date (probable delivery date)
ReproductionSchema.virtual('dueDate').get(function () {
    if (!this.date) return null;
    const date = new Date(this.date);
    date.setDate(date.getDate() + GESTATION_DAYS);
    return date;
});

ReproductionSchema.set('toJSON', { virtuals: true });
ReproductionSchema.set('toObject', { virtuals: true });

// Static method to get upcoming heat events
ReproductionSchema.statics.getUpcomingHeats = async function (days = 14) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    const heats = await this.find({ type: 'heat' }).populate('animalId');

    return heats.map(heat => ({
        animal: heat.animalId,
        predictedDate: heat.nextHeatDate,
        type: 'predicted_heat'
    })).filter(e => e.predictedDate && e.predictedDate >= today && e.predictedDate <= futureDate);
};

export default mongoose.model('Reproduction', ReproductionSchema);
