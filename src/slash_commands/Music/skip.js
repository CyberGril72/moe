const Client = require("../../../index");
const { CommandInteraction, MessageEmbed, Permissions } = require("discord.js");
const { intReply, intCheck } = require("../../handlers/functions");

module.exports = {
    data: {
        name: "skip",
        description: "To skip a song/track from the queue."
    },

    dj: true,

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {String} color 
     */

    execute: async (client, interaction, color) => {
        if(!interaction.replied) await interaction.deferReply({ ephemeral: true }).catch(() => {});

        let check = await intCheck(interaction, Permissions.FLAGS.DEAFEN_MEMBERS)
        if(check !== true) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

        if(!interaction.member.voice.channel) return await intReply(interaction, "You are not connected to a voice channel to use this command.", color);

        if(interaction.guild.me.voice.channel && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) return await intReply(interaction, `You are not connected to ${interaction.guild.me.voice.channel} to use this command.`, color);

        const player = client.player.get(interaction.guildId);

        if(!player) return await intReply(interaction, "Nothing is playing right now.", color);
        if(!player.queue) return await intReply(interaction, "Nothing is playing right now.", color);
        if(!player.queue.current) return await intReply(interaction, "Nothing is playing right now.", color);
        if(!player.queue.size) return await intReply(interaction, "Don't have enough songs left in the queue to skip.");

        player.stop();
        return await interaction.editReply({
            embeds: [new MessageEmbed().setColor(color).setDescription(`Skipped [${player.queue.current.title}](${player.queue.current.uri})`)]
        }).catch(() => {});

    }
}