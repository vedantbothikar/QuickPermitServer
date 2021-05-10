const mongoose = require("mongoose");

// Modal TeacherForm Schema

const teacherHeadSchema = mongoose.Schema({
    dateforrequest: {
        type: Date,
        default: Date.now,
    },
    clubSelected: {
        type: String,
        required: true
    },
    teacherStatus: {
        type: Number,
        default: 0,
    },
    rejectedMessage: {
        type: String,
        default: "None"
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    }
})


//teacherStatus for admin 
//  0 - default
//  1 - guardian
// -1 - rejected guardian

const teacherHeadForm = mongoose.model("teacherHeadForm", teacherHeadSchema, "teacherHeadsCollection");

module.exports = teacherHeadForm;
