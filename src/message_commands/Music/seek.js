const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { oops, good } = require("../../handlers/functions")
const ms = require("ms");
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    name: "seek",
    description: "To seek to a position in the current playing song.",
    cooldown: 3,
    dev: false,
    usage: "<position>",
    aliases: [],
    category: "Music",
    examples: ["seek 5m"],
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
        const { duration, isSeekable } = player.queue.current;

        if(!isSeekable) return await oops(message.channel, `This track is unable to seek.`, color);
        let position = ms(args[0]);
        if(isNaN(position)) return await oops(message.channel, `Position must be a valid number.`, color);
        if(position <= 0) return await oops(message.channel, `Position must be higher than 0.`, color);
        if(position >= duration) return await oops(message.channel, `Position must be lower than the songs duration.`, color);

        player.seek(position);
        return await good(message.channel, `Seeked \`[ ${prettyMilliseconds(position)} ]\` to \`[ ${prettyMilliseconds(player.position)} / ${prettyMilliseconds(duration)} ]\``);
    }
}