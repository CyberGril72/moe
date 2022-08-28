const Client = require("../../../index");
const { CommandInteraction, MessageActionRow } = require("discord.js");
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    data: {
        name: "info",
        description: "Gets info about me."
    },

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {String} color 
     */

    execute: async (client, interaction, color) => {
        if(!interaction.replied) await interaction.deferReply().catch(() => {});
        let u = 0;
        client.guilds.cache.forEach((x) => u = u + x.memberCount);

        const embed1 = client.embed().setColor(color).setDescription(`I'm a discord music bot with a wide variety of commands.`).setTitle(`${client.user.username} Stats/Info`).addFields([
            {
                name: "Birthday",
                value: `<t:${Math.round(client.user.createdTimestamp/1000)}>`,
                inline: true
            },
            {
                name: "Joined On",
                value: `<t:${Math.round(interaction.guild.me.joinedTimestamp/1000)}>`,
                inline: true
            },
            {
                name: "Developer(s)",
                value: `[Venom9718](https://discord.com/users/${client.config.dev[0]}) & [Blacky](https://discord.com/users/${client.config.dev[1]})`
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
                value: `\`[ ${u} ]\``,
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

        return await interaction.editReply({ embeds: [embed1], components: [row1] }).catch(() => {});
    }
}