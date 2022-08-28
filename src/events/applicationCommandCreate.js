const Client = require("../../index");
const { ApplicationCommand } = require("discord.js");

module.exports = {
    name: "applicationCommandCreate",

    /**
     * 
     * @param {Client} client 
     * @param {ApplicationCommand} command 
     */

    execute: (client, command) => {
        console.log(`Slash Command Created: ${command.name}`);
    }
}