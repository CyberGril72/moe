const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { replyOops, msgReply } = require("../../handlers/functions")

module.exports = {
    name: "addprevious",
    description: "To add the previously played song to the queue.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: ["previous"],
    category: "Music",
    examples: ["addprevious", "previous"],
    sub_commands: [],
    args: false,
    player: { active: true, voice: true, dj: false, djPerm: null },
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
        if(!player.queue.previous) return await replyOops(message, `No previously added songs found on the queue.`, color);

        player.queue.add(player.queue.previous);
        if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();
        const { title, uri } = player.queue.previous;

        return await msgReply(message, `Added [${title && uri ? `[${title}](${uri})` : title}] to the queue.`, color);
    }
}