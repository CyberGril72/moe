const Client = require("../../../index");
const { intReply } = require("../../handlers/functions");
const { CommandInteraction, Permissions } = require("discord.js");

module.exports = {
    data: {
        name: "join",
        description: "Joins your voice channel."
    },

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {String} color 
     */

    execute: async (client, interaction, color) => {
        if(!interaction.replied) await interaction.deferReply().catch(() => {});
        let player = client.player.get(interaction.guildId);

        if(player && player.voiceChannel && player.state === "CONNECTED") {
            return await intReply(interaction, `I'm already connected to <#${player.voiceChannel}> voice channel!`, color);
        } else {
            if(!interaction.member.voice.channel) return await intReply(interaction, `You are not connected to a voice channel to use this command!`, color);

            if(!interaction.guild.me.permissions.has([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK])) return await intReply(interaction, `I don't have enough permissions to execute this command.`, color);

            player = client.player.create({ guild: interaction.guildId, textChannel: interaction.channelId, voiceChannel: interaction.member.voice.channelId, selfDeafen: true, volume: 80 });

            if(player && player.state !== "CONNECTED") player.connect();
            return await intReply(interaction, `Joined <#${interaction.member.voice.channelId}>`, color);
        };
    }
}