const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { oops, good } = require("../../handlers/functions");

module.exports = {
    name: "resume",
    description: "To resume the current paused song.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: ["r"],
    category: "Music",
    examples: ["resume"],
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
     * @param {Any[]} _args
     * @param {String} _prefix
     * @param {String} color
     */

    execute: async (client, message, _args, _prefix, color) => {
        let player = client.player.get(message.guildId);
        const { title, uri } = player.queue.current;
        if(player.paused) {
            player.pause(false);
            return await good(message.channel, `${title && uri ? `[${title}](${uri})` : title} is now paused.`, color);
        } else {
            return await oops(message.channel, `${title && uri ? `[${title}](${uri})` : title} is not paused to resume.`, color);
        };
    }
}