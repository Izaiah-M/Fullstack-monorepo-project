import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  body: {
    type: String,
    required: true
  },
  x: {
    type: Number
  },
  y: {
    type: Number
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for search optimization
commentSchema.index({ body: 1 });
commentSchema.index({ fileId: 1 });
commentSchema.index({ authorId: 1 });
commentSchema.index({ parentId: 1 });
commentSchema.index({ createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;