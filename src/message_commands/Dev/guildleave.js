const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { oops } = require("../../handlers/functions")

module.exports = {
    name: "guildleave",
    description: "To leave a guild.",
    cooldown: 3,
    dev: true,
    usage: "<id>",
    aliases: [],
    category: "Dev",
    examples: [],
    sub_commands: [],
    args: true,
    player: { active: false, voice: false, dj: false, djPerm: null },
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
        let guild = client.guilds.cache.get(args[0]);
        if(!guild) return await oops(message.channel, `Couldn't find any server with id: \`${args[0]}\``, color);

        await guild.leave();
    }
}