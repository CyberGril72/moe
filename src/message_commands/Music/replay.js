const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { replyOops, msgReply } = require("../../handlers/functions")

module.exports = {
    name: "replay",
    description: "To replay the current playing song.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: [],
    category: "Music",
    examples: ["replay"],
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

        if(!player.queue.current.isSeekable) return await replyOops(message, `Cannot replay this current playing track.`, color);

        player.seek(0);
        return await msgReply(message, `Replaying [${player.queue.current.title}](${player.queue.current.uri})`, color);
    }
}