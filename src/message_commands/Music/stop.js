const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { good, oops } = require("../../handlers/functions")

module.exports = {
    name: "stop",
    description: "To stop/destroy the player.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: ["destroy", "disconnect", "dc"],
    category: "Music",
    examples: ["stop", "destroy", "disconnect", "dc"],
    sub_commands: [],
    args: false,
    player: { active: false, voice: true, dj: true, djPerm: Permissions.FLAGS.DEAFEN_MEMBERS },
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
        if(!player) return await oops(message.channel, `Nothing is playing right now.`, color);
        player.destroy();
        return await good(message.channel, `Player is now stopped/destroyed.`, color);
    }
}