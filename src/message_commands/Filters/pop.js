const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { msgReply } = require("../../handlers/functions")

module.exports = {
    name: "pop",
    description: "To toggle enable/disable pop filter/effect.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: [],
    category: "Filters",
    examples: ["pop"],
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

        if(player.pop) {
            player.setPop(false);
            return await msgReply(message, `Pop filter/effect is now disabled.`, color);
        } else {
            player.setPop(true);
            return await msgReply(message, `Pop filter/effect is now enabled.`, color);
        };
    }
}