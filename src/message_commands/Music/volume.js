const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { oops, good } = require("../../handlers/functions")

module.exports = {
    name: "volume",
    description: "To change/see the volume of the player.",
    cooldown: 3,
    dev: false,
    usage: "[amount]",
    aliases: ["sound", "vol"],
    category: "Music",
    examples: ["volume", "volume 50", "vol 88"],
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
        if(args.length) {
            let amount = parseInt(args[0]);

            if(isNaN(amount)) return await oops(message.channel, `Volume amount should be a valid number.`, color);
            if(amount < 10) return await oops(message.channel, `Volume amount shouldn't be lower than 10.`, color);
            if(amount > 200) return await oops(message.channel, `Volume amount shouldn't be higher than 200.`, color);

            if(player.volume === amount) return await oops(message.channel, `Volume amount is already at ${player.volume}`, color);

            if(player) player.setVolume(amount);
            return await good(message.channel, `Volume amount set to \`[ ${amount}% ]\``)
        } else {
            return await good(message.channel, `Current Player Volume: \`[ ${player.volume}% ]\``)
        };
    }
}