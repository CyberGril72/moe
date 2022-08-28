const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { good } = require("../../handlers/functions")

module.exports = {
    name: "autoplay",
    description: "To toggle enable/disable autoplay.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: ["au"],
    category: "Music",
    examples: ["autoplay"],
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
        let au = player.get("autoplay");
        if(!au) {
            player.set("autoplay", true);
            return await good(message.channel,"Autoplay is now enabled.", color);
        } else {
            player.set("autoplay", false);
            return await good(message.channel,"Autoplay is now disabled.", color);
        };
    }
}