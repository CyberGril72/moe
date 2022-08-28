const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { moveArray, oops, msgReply } = require("../../handlers/functions")

module.exports = {
    name: "jumpto",
    description: "To jump to a track in the queue.",
    cooldown: 5,
    dev: false,
    usage: "<track_number>",
    aliases: ["jt", "jump"],
    category: "Music",
    examples: ["jumpto 3"],
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

        if(!player.queue.size) return await oops(message.channel, `No tracks left in the queue to play top.`, color);

        let num = parseInt(args[0]);
        if(isNaN(num)) return await oops(message.channel, `Please provide a valid track number.`, color);

        if(num > player.queue.size) return await oops(message.channel, `Track number shouldn't be more than the queue's length.`, color);

        if(num <= 0) return await oops(message.channel, `Track number shouldn't be lower than or equal to 0.`, color);

        let track = player.queue[num - 1];

        if(num === 1) {
            player.stop();
            return await msgReply(message, `Jumped to [${track.title}](${track.uri})`, color);
        } else {
            const move = moveArray(player.queue, num - 1, 0);

            player.queue.clear();
            player.queue.add(move);
            if(player.queue.current.uri !== track.uri || player.queue.current.title !== track.title) player.stop();

            return await msgReply(message, `Jumped to [${track.title}](${track.uri})`, color);
        };
    }
}