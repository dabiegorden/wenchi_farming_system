const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  appName: {
    type: String,
    required: true,
    default: 'Wenchi Farm Management'
  },
  appVersion: {
    type: String,
    default: '1.0.0'
  },
  weatherApiKey: {
    type: String,
    default: ''
  },
  farmLocation: {
    latitude: {
      type: String,
      default: '7.7340'
    },
    longitude: {
      type: String,
      default: '-2.1009'
    }
  },
  theme: {
    primaryColor: {
      type: String,
      default: '#10b981' // Green color
    },
    secondaryColor: {
      type: String,
      default: '#1f2937' // Dark gray
    },
    accentColor: {
      type: String,
      default: '#3b82f6' // Blue
    }
  },
  contactEmail: {
    type: String,
    default: 'admin@example.com'
  },
  sessionTTL: {
    type: Number,
    default: 3600000 // 1 hour in milliseconds
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  allowRegistration: {
    type: Boolean,
    default: true
  },
  defaultUserRole: {
    type: String,
    enum: ['user', 'researcher'],
    default: 'user'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Ensure there's only one settings document
settingsSchema.statics.findOneOrCreate = async function(query, doc) {
  const settings = await this.findOne(query);
  return settings || await this.create(doc || {});
};

// Update the lastUpdated field on save
settingsSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;