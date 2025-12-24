import mongoose from 'mongoose';

const AnimalSchema = new mongoose.Schema({
    identifier: {
        type: String,
        required: [true, 'El identificador es requerido'],
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true
    },
    speciesId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Species',
        required: [true, 'La especie es requerida']
    },
    birthDate: {
        type: Date
    },
    sex: {
        type: String,
        enum: ['male', 'female', ''],
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'sold', 'deceased'],
        default: 'active'
    },
    image: {
        type: String,  // Base64 encoded image or URL
        default: ''
    },
    notes: {
        type: String,
        trim: true
    },
    customAttributes: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,  // Dynamic attributes based on species
        default: {}
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for faster searches

AnimalSchema.index({ name: 'text', identifier: 'text' });
AnimalSchema.index({ speciesId: 1 });
AnimalSchema.index({ status: 1 });

// Virtual for age calculation
AnimalSchema.virtual('age').get(function () {
    if (!this.birthDate) return null;
    const today = new Date();
    const birth = new Date(this.birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
});

// Ensure virtuals are included in JSON output
AnimalSchema.set('toJSON', { virtuals: true });
AnimalSchema.set('toObject', { virtuals: true });

export default mongoose.model('Animal', AnimalSchema);
