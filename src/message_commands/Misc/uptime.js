const { Message } = require("discord.js");
const prettyMilliseconds = require("pretty-ms");
const Client = require("../../../index");

module.exports = {
    name: "uptime",
    description: "Gets my uptime.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: [],
    category: "Misc",
    examples: [],
    sub_commands: [],
    args: false,
    player: { active: false, voice: false, dj: false, djPerm: null },
    permissions: {
        client: [],
        author: []
    },

    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {Any[]} args
     * @param {String} prefix
     * @param {String} color
     */

    execute: async (client, message, args, prefix, color) => {
        return await message.reply({ content: `**Uptime: \`${prettyMilliseconds(client.uptime)}\`**` })
    }
}