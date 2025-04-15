// src/models/File.js
import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for search optimization
fileSchema.index({ name: 1 });
fileSchema.index({ projectId: 1 });
fileSchema.index({ authorId: 1 });
fileSchema.index({ createdAt: -1 });

const File = mongoose.model('File', fileSchema);

export default File;