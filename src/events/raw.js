const Client = require("../../index");

module.exports = {
    name: "raw",

    /**
     * 
     * @param {Client} client 
     * @param {*} data 
     */

    execute: (client, data) => client.player.updateVoiceState(data)
}