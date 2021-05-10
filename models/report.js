const mongoose = require("mongoose");

// Report Modal Schema

const reportSchema = new mongoose.Schema({

    eventName: {
        type: String,
        required: true,
    },
    eventCoordinator: {
        type: String,
        required: true,
    },
    organizedBy: {
        type: String,
        required: true
    },
    eventStartDate: {
        type: Date,
    },
    eventEndDate: {
        type: Date,
    },
    subevents: [
        {
            name: String,
            winners: String,
            participants: Number,
            startDate: Date,
            endDate: Date
        }
    ],
    eventParticipants: {
        type: Number,
        required: true,
    },
    techRegistrations: {
        type: Number,
        required: false
    },
    nontechRegistrations: {
        type: Number,
        required: false
    },
    description: {
        type: String,
        required: false
    }

})


const Report = mongoose.model("Report", reportSchema);

module.exports = Report;