const mongoose = require('mongoose');

const qanSchema = new mongoose.Schema(
  {
    qanNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    serialNumbers: {
      type: [String],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

qanSchema.index({ serialNumbers: 1 });

module.exports = mongoose.model('Qan', qanSchema);
