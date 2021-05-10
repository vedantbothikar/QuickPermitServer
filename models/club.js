const mongoose = require("mongoose");

// club modal

const clubSchema = mongoose.Schema({
    clubName: {
        type: String,
        required: true,
    },
    teacherHeads: {
        type: "array",
    },
    clubHeads: {
        type: "array",
    },
    members: {
        type: "array",
    }
})

const club = mongoose.model("club", clubSchema, "clubsCollection");

module.exports = club;