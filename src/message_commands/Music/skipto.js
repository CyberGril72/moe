const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { invalidArgs, good, oops } = require("../../handlers/functions")

module.exports = {
    name: "skipto",
    description: "To skip to a track in the queue.",
    cooldown: 3,
    dev: false,
    usage: "<track_number>",
    aliases: ["sto"],
    category: "Music",
    examples: ["skipto 5"],
    sub_commands: [],
    args: true,
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
        if(!player.queue.size) return await oops(message.channel, `Don't have enough tracks left in the queue to skip.`, color);
        let trackNumber = parseInt(args[0]);

        if(isNaN(trackNumber)) return await invalidArgs("skipto", message, `Please provide a valid number.`, client);
        if(trackNumber <= 0) return await invalidArgs("skipto", message, `Please provide a valid track number.`, client);
        if(trackNumber > player.queue.size) return await invalidArgs("skipto", message, `Please provide a valid track number.`, client);

        player.stop(trackNumber);
        return await good(message.channel, `Skipped to track number \`[ ${args[0]} ]\` in the queue.`, color);
    }
}