const mongoose = require("mongoose");

// leaveForm ModalSchema

const leaveFormSchema = new mongoose.Schema({
  reason: {
    type: String,
    required: true
  },
  illness: {
    type: String,
    required: false
  },
  clubselected: {
    type: String,
    required: false
  },
  activity: {
    type: String,
    required: false,
  },
  otherDescription: {
    type: String,
    required: false
  },
  datefrom: {
    type: Date,
    required: true
  },
  dateto: {
    type: Date,
    required: true
  },
  teacherselected: {
    type: "array",
    required: true,
  },
  teacherapproved: {
    type: "array",
    required: false
  },
  teacherrejected: {
    type: "array",
    required: false
  },
  rejectedmessage: {
    type: String,
    required: false
  },
  status: {
    type: String,
    default: "pending"
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

const leaveApplicationForm = mongoose.model("leaveApplicationForm", leaveFormSchema);

module.exports = leaveApplicationForm;
