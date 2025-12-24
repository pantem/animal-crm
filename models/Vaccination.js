import mongoose from 'mongoose';

const VaccinationSchema = new mongoose.Schema({
    animalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Animal',
        required: [true, 'El animal es requerido']
    },
    vaccineName: {
        type: String,
        required: [true, 'El nombre de la vacuna es requerido'],
        trim: true
    },
    applicationDate: {
        type: Date,
        required: [true, 'La fecha de aplicación es requerida'],
        default: Date.now
    },
    nextDoseDate: {
        type: Date
    },
    veterinarian: {
        type: String,
        trim: true
    },
    batch: {
        type: String,  // Vaccine lot number
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

// Indexes for faster queries
VaccinationSchema.index({ animalId: 1 });
VaccinationSchema.index({ applicationDate: -1 });
VaccinationSchema.index({ nextDoseDate: 1 });
VaccinationSchema.index({ vaccineName: 'text' });

// Virtual to check if vaccination is pending
VaccinationSchema.virtual('isPending').get(function () {
    if (!this.nextDoseDate) return false;
    return new Date(this.nextDoseDate) > new Date();
});

// Virtual to check if vaccination is overdue
VaccinationSchema.virtual('isOverdue').get(function () {
    if (!this.nextDoseDate) return false;
    return new Date(this.nextDoseDate) < new Date();
});

VaccinationSchema.set('toJSON', { virtuals: true });
VaccinationSchema.set('toObject', { virtuals: true });

export default mongoose.model('Vaccination', VaccinationSchema);
