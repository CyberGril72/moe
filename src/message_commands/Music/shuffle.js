const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { oops, msgReply } = require("../../handlers/functions")

module.exports = {
    name: "shuffle",
    description: "To shuffle the queue.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: ["sh"],
    category: "Music",
    examples: ["shuffle", "sh"],
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
        if(!player.queue.size) return await oops(message.channel, `Don't have enough tracks left in the queue to shuffle.`, color);
        
        player.set("beforeShuffle", player.queue);
        player.queue.shuffle();
        return await msgReply(message, `Queue is now shuffled.`, color);
    }
}