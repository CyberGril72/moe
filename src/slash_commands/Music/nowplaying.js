const Client = require("../../../index");
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { intReply } = require("../../handlers/functions");
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    data: {
        name: "nowplaying",
        description: "Shows the current playing song."
    },

    dj: false,

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {String} color 
     */

    execute: async (client, interaction, color) => {
        if(!interaction.replied) await interaction.deferReply().catch(() => {});
        let player = client.player.get(interaction.guildId);
        if(!player) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue.current) return await intReply(interaction, `Nothing is playing right now.`, color);

        const { title, uri, duration, requester, thumbnail, author, isStream } = player.queue.current;

        const embed1 = client.embed().setColor(color).setDescription(`${player.paused ? "⏸️ " : ""}[${title}](${uri})`).setTitle(`Now playing`).setAuthor({name: interaction.user.tag,iconURL: interaction.user.displayAvatarURL({ dynamic: true })});

        if(duration) embed1.addField("Duration", `\`[ ${prettyMilliseconds(duration)} ]\``, true);
        if(author) embed1.addField("Author", `${author}`, true);
        if(thumbnail) embed1.setThumbnail(thumbnail);
        if(requester) embed1.addField("Requester", `${requester}`, true);

        embed1.addField("Loop", `${player.trackRepeat ? "`Enabled`" : "`Disabled`"}`, true);

        let pbar = new Array(16).fill("▬");
        let percentage = player.position / duration * 16;

        pbar[Math.round(percentage)] = "🔘";

        embed1.addField("Percentage Bar", `**[**${pbar.join("")}**]**\n\`[ ${prettyMilliseconds(player.position)} / ${isStream ? "◉ LIVE" : prettyMilliseconds(duration)} ]\``, false);

        return await interaction.editReply({ embeds: [embed1] }).catch(() => {});
    }
}
