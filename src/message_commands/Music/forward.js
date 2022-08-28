const { Message, Permissions } = require("discord.js");
const prettyMilliseconds = require("pretty-ms");
const Client = require("../../../index");
const { oops, good } = require("../../handlers/functions")

module.exports = {
    name: "forward",
    description: "To foward the current playing song 10s as default.",
    cooldown: 3,
    dev: false,
    usage: "[position]",
    aliases: ["f"],
    category: "Music",
    examples: ["forward", "forward 3", "f", "f 10"],
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
        if(!player.queue.current.isSeekable) return await oops(message.channel, `This track is unable to seek forward.`, color);

        let position = 10000;
        if(args[0]) position = parseInt(args[0])*1000;
        let seekPosition = player.position + position;
        if(seekPosition >= player.queue.current.duration) return await oops(message.channel, `Cannot forward any futher more of this track.`, color);

        player.seek(seekPosition);
        return await good(message.channel, `Forwared \`[ ${prettyMilliseconds(position)} ]\` to \`[ ${prettyMilliseconds(player.position)} / ${prettyMilliseconds(player.queue.current.duration)} ]\``);
    }
}