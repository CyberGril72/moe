const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { msgReply } = require("../../handlers/functions")

module.exports = {
    name: "electronic",
    description: "To toggle enable/disable electronic filter/effect.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: [],
    category: "Filters",
    examples: ["electronic"],
    sub_commands: [],
    args: false,
    player: { active: true, voice: true, dj: true, djPerm: Permissions.FLAGS.DEAFEN_MEMBERS },
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
        const player = client.player.get(message.guildId);

        if(player.electronic) {
            player.setElectronic(false);
            return await msgReply(message, `Electronic filter/effect is now disabled.`, color);
        } else {
            player.setElectronic(true);
            return await msgReply(message, `Electronic filter/effect is now enabled.`, color);
        };
    }
}