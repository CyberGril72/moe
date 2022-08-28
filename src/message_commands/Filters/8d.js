const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { msgReply } = require("../../handlers/functions")

module.exports = {
    name: "8d",
    description: "To toggle enable/disable 8d filter/effect.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: ["3d", "8D", "3D"],
    category: "Filters",
    examples: ["8d", "8D"],
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
        if(player._8d) {
            player.set8D(false);
            return await msgReply(message, `8D filter/effect is now disabled.`, color);
        } else {
            player.set8D(true);
            return await msgReply(message, `8D filter/effect is now enabled.`, color);
        };
    }
}