const mongoose = require("mongoose");

// Form ModalSchema

const formSchema = new mongoose.Schema({
  dateforrequest: {
    type: Date,
    default: Date.now,
  },
  clubselected: {
    type: String,
    required: true,
  },
  rooms: {
    type: String,
    required: false,
  },
  requirements: {
    type: String,
    required: true,
  },
  starthr: {
    type: Number,
    required: true,
  },
  startmin: {
    type: Number,
    required: true,
  },
  endhr: {
    type: Number,
    required: true,
  },
  endmin: {
    type: Number,
    required: true,
  },
  eventName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  teacherselected: {
    type: "array",
    required: true,
  },
  teacherapproved: {
    type: "array",
  },
  teacherrejected: {
    type: "array",
  },
  rejectedmessage: {
    type: String,
    required: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

const Form = mongoose.model("Form", formSchema);

module.exports = Form;
