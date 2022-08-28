const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const { intReply, intCheck } = require("../../handlers/functions");

module.exports = {
    data: {
        name: "stop",
        description: "To stop/destroy the player."
    },

    dj: true,

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {String} color 
     */

    execute: async (client, interaction, color) => {
        if(!interaction.replied) await interaction.deferReply().catch(() => {});
        let check = await intCheck(interaction, Permissions.FLAGS.MUTE_MEMBERS);
        if(!check) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

        if(!interaction.member.voice.channel) return await intReply(interaction, `You are not connectdd to a voice channel to use this command.`, color);

        const player = client.player.get(interaction.guildId);
        if(!player) return await intReply(interaction, `Nothing is playing right now.`, color);

        if(interaction.guild.me.voice.channel && interaction.guild.me.voice.channelId !== interaction.member.voice.channelId) return await intReply(interaction, `You are not connected to ${interaction.guild.me.voice.channel} to use this command.`, color);

        player.destroy();
        return await intReply(interaction, `Player has been stopped/destroyed.`, color);
    }
}