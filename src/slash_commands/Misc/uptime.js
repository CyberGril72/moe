const Client = require("../../../index");
const prettyMilliseconds = require("pretty-ms");
const { intReply } = require("../../handlers/functions");
const { CommandInteraction } = require("discord.js");

module.exports = {
    data: {
        name: "uptime",
        description: "Gets my uptime."
    },

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {String} color 
     */

    execute: async (client, interaction, color) => {
        return await interaction.reply({ content: `**Uptime: \`${prettyMilliseconds(client.uptime)}\`**`, ephemeral: true }).catch(() => {});
    }
}