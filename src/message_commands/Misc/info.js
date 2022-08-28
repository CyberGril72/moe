const { Message, MessageActionRow } = require("discord.js");
const prettyMilliseconds = require("pretty-ms");
const Client = require("../../../index");

module.exports = {
    name: "info",
    description: "Gets info/stats about me.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: ["stats", "botinfo", "bot"],
    category: "Misc",
    examples: [],
    sub_commands: [],
    args: false,
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
        let usersCount = 0;
        client.guilds.cache.forEach((x) => usersCount = usersCount + x.memberCount);

        const embed1 = client.embed().setColor(color).setDescription(`I'm a discord music bot with a wide variety of commands.`).setTitle(`${client.user.username} Stats/Info`).addFields([
            {
                name: "Birthday",
                value: `<t:${Math.round(client.user.createdTimestamp/1000)}>`,
                inline: true
            },
            {
                name: "Joined On",
                value: `<t:${Math.round(message.guild.me.joinedTimestamp/1000)}>`,
                inline: true
            },
            {
                name: "Developer(s)",
                value: `[yashika](https://discord.com/users/${client.config.dev[0]}) & [yuzuru](https://discord.com/users/${client.config.dev[1]})`,
                inline: false
            },
            {
                name: "Platform",
                value: `\`${process.platform}\``,
                inline: true
            },
            {
                name: "Message Commands",
                value: `\`[ ${client.commands.filter((x) => x.category && x.category !== "Dev").size} ]\``,
                inline: true
            },
            {
                name: "Slash Commands",
                value: `\`[ ${client.slash_commands.size} ]\``,
                inline: true
            },
            {
                name: "Cached Server(s)",
                value: `\`[ ${client.guilds.cache.size} ]\``,
                inline: true
            },
            {
                name: "Cached Channel(s)",
                value: `\`[ ${client.channels.cache.size} ]\``,
                inline: true
            },
            {
                name: "Cached User(s)",
                value: `\`[ ${client.users.cache.size} ]\``,
                inline: true
            },
            {
                name: "Total Users",
                value: `\`[ ${usersCount} ]\``,
                inline: true
            },
            {
                name: "Total Player(s)",
                value: `\`[ ${client.player.players.size} ]\``,
                inline: true
            },
            {
                name: "Uptime",
                value: `\`[ ${prettyMilliseconds(client.uptime)} ]\``,
                inline: true
            }
        ]);

        const inv = client.button().setLabel("Invite").setURL(client.config.links.invite).setStyle("LINK");

        const sup = client.button().setLabel("Support Server").setURL(client.config.links.server).setStyle("LINK");
        
        const row1 = new MessageActionRow().addComponents(inv, sup);

        return await message.reply({ embeds: [embed1], components: [row1] }).catch(() => {});
    }
}
