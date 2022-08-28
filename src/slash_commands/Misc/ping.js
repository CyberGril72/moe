const { Client, CommandInteraction, MessageEmbed } = require("discord.js");

module.exports = {
    data: {
        name: "ping",
        description: "Returns the latency of the bot."
    },

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {String} color
     */

    execute: async (client, interaction, color) => {
        await interaction.reply({
            content: "**PINGING...**"
        }).catch(() => {});

        let ping = interaction.createdTimestamp - Date.now();
        let api_ping = client.ws.ping;

        if(ping <= 0) ping = Date.now() - interaction.createdTimestamp;

        if(interaction.replied) await interaction.editReply({
            content: "‎",
            embeds: [new MessageEmbed().setColor(color).setTimestamp().setAuthor({name: "Pong",iconURL: client.user.displayAvatarURL()}).addFields([
                {
                    name: "Bot Latency",
                    value: `\`\`\`ini\n[ ${ping}ms ]\n\`\`\``,
                    inline: true
                }, {
                    name: "API Latency",
                    value: `\`\`\`ini\n[ ${api_ping}ms ]\n\`\`\``,
                    inline: true
                }
            ]).setFooter({text: `Requested by ${interaction.user.username}`,iconURL: interaction.user.displayAvatarURL({ dynamic: true })})]
        }).catch(() => {});
        else await interaction.followUp({
            content: "🏓",
            embeds: [new MessageEmbed().setColor(color).setTimestamp().setAuthor({name: "Pong", iconURL: client.user.displayAvatarURL()}).addFields([
                {
                    name: "Bot Latency",
                    value: `\`\`\`ini\n[ ${ping}ms ]\n\`\`\``,
                    inline: true
                }, {
                    name: "API Latency",
                    value: `\`\`\`ini\n[ ${api_ping}ms ]\n\`\`\``,
                    inline: true
                }
            ]).setFooter({text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true })})]
        }).catch(() => {});
    }
}