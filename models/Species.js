import mongoose from 'mongoose';

// Schema for custom attributes within a species
const AttributeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'number', 'date', 'select', 'boolean'],
        default: 'text'
    },
    options: {
        type: String,  // Comma-separated options for 'select' type
        default: ''
    },
    required: {
        type: Boolean,
        default: false
    }
}, { _id: true });

// Main Species Schema
const SpeciesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre de la especie es requerido'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    icon: {
        type: String,
        default: '🐾',
        maxlength: 4
    },
    attributes: [AttributeSchema]
}, {
    timestamps: true,
    versionKey: false
});

// Index for faster searches
SpeciesSchema.index({ name: 'text' });

export default mongoose.model('Species', SpeciesSchema);
