const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { msgReply, replyOops } = require("../../handlers/functions")

module.exports = {
    name: "unshuffle",
    description: "To unshuffle a shuffled queue.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: ["uns"],
    category: "Music",
    examples: ["unshuffle"],
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
        let beforeShuffleQueue = player.get("beforeShuffle");

        if(!beforeShuffleQueue || beforeShuffleQueue === null) return await replyOops(message, `The queue has not been shuffled to unshuffle.`, color);

        player.queue.clear();
        player.queue.add(beforeShuffleQueue);

        player.set("beforeShuffle", null);
        return await msgReply(message, `Queue is now unshuffled.`, color);
    }
}