import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  { name: String, text: String },
  { _id: false }
);

const graphSchema = new mongoose.Schema(
  {
    nodes: [{ id: String, label: String, kind: String }],
    edges: [{ from: String, to: String }],
  },
  { _id: false }
);

const workflowSchema = new mongoose.Schema({
  title: { type: String, default: 'Workflow' },
  summary: { type: String, default: '' },
  selected: { type: Boolean, default: true },
  graph: { type: graphSchema, default: () => ({ nodes: [], edges: [] }) },
});

const ruleSchema = new mongoose.Schema({
  workflowIndex: { type: Number, default: 0 },
  text: { type: String, required: true },
  explicit: { type: Boolean, default: true },
  selected: { type: Boolean, default: true },
});

const storySchema = new mongoose.Schema({
  workflowIndex: { type: Number, default: 0 },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  selected: { type: Boolean, default: true },
  linkedRuleIndexes: { type: [Number], default: [] },
});

const testCaseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['positive', 'negative', 'edge', 'validation'],
    default: 'positive',
  },
  preconditions: { type: String, default: '' },
  steps: { type: [String], default: [] },
  expected: { type: String, default: '' },
  selected: { type: Boolean, default: true },
  explicit: { type: Boolean, default: true },
});

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, default: 'Untitled project' },
    requirementText: { type: String, default: '' },
    sourceFileName: { type: String, default: '' },
    step: {
      type: String,
      enum: ['name', 'context', 'design', 'workflows', 'rules', 'stories', 'testcases', 'export'],
      default: 'name',
    },
    latestStep: {
      type: String,
      enum: ['name', 'context', 'design', 'workflows', 'rules', 'stories', 'testcases', 'export'],
      default: 'name',
    },
    contextNote: { type: String, default: '' },
    files: { type: [fileSchema], default: [] },
    design: {
      category: { type: String, default: '' },
      technique: { type: String, default: '' },
      format: { type: String, enum: ['standard', 'bdd', 'bdd2'], default: 'standard' },
      wantCases: { type: Boolean, default: true },
      wantStories: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ['draft', 'generating', 'ready', 'failed'],
      default: 'draft',
    },
    workflows: { type: [workflowSchema], default: [] },
    rules: { type: [ruleSchema], default: [] },
    userStories: { type: [storySchema], default: [] },
    testCases: { type: [testCaseSchema], default: [] },
    errorMessage: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Session = mongoose.model('Session', sessionSchema);
