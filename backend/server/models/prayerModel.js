const mongoose = require('mongoose');

const prayerSchema = new mongoose.Schema({
    title: {
        type: String,
        require: 'Title is required'
    },
    description: {
        type: String,
        require: 'Description is required'
    },
    photo: {
        data: Buffer,
        contentType: String
    },
    type: {
        type: String,
        require: 'Type is required'
    },
    feed: {
        type: String,
    },
    energys: [{
        num: Number,
        date: String,
        created: { type: Date, default: Date.now },
        postedBy: { type: mongoose.Schema.ObjectId, ref: 'UserInfo' },
        userName: String,
        location: String,
        faith: String,
        feed: String
    }],
    postedBy: { type: mongoose.Schema.ObjectId, ref: 'UserInfo' },
    created: {
        type: Date,
        default: Date.now
    }
},
);

const Prayer = mongoose.model("Prayer", prayerSchema);

module.exports = Prayer;