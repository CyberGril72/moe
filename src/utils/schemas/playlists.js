const { model, Schema } = require("mongoose");

module.exports = model("playlist-schema", new Schema({
    _id: {
        type: String,
        required: true
    },

    userName: {
        type: String,
        required: true
    },

    playlistName: {
        type: String,
        required: true
    },

    playlist: {
        type: Array,
        default: null
    },

    createdOn: {
        type: String,
        required: false
    }
}));