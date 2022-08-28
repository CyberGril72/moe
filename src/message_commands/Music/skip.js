const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { good, oops, msgReply } = require("../../handlers/functions")

module.exports = {
    name: "skip",
    description: "To skip the current playing song.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: ["s"],
    category: "Music",
    examples: ["skip"],
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
     * @param {String} _prefix
     * @param {String} color
     */

    execute: async (client, message, args, prefix, color) => {
        let player = client.player.get(message.guildId);
        if(!player.queue.size) return await oops(message.channel, `Don't have enough tracks in the queue to use this command.`, color);
        const { title, uri } = player.queue.current;

        player.stop();
        return await msgReply(message, `Skipped ${title && uri ? `[${title}](${uri})` : title}`, color);
    }
}