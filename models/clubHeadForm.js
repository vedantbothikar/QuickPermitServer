const mongoose = require("mongoose");

// club Head Form ModalSchema

const clubHeadFormSchema = mongoose.Schema({
    dateforrequest: {
        type: Date,
        default: Date.now,
    },
    clubposition: {
        type: String,
    },
    clubselected: {
        type: String,
        required: true
    },
    teacherselected: {
        type: "array",
    },
    teacherapproved: {
        type: "array",
    },
    teacherrejected: {
        type: "array",
    },
    status: {
        type: String,
        default: "pending"
    },
    memberStatus: {
        type: Number,
        default: 0,
    },
    rejectedmessage: {
        type: String,
        default: 'None',
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    }
})


//memberStatus for admin 

//  0 - default
//  100 - request sent
//  1 - member
//  2 - authority User
// -1 - rejected member
// -2 - rejected authority User

const clubHeadForm = mongoose.model("clubHeadForm", clubHeadFormSchema, "clubHeadsCollection");

module.exports = clubHeadForm;
