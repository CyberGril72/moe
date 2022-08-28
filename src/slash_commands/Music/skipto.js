const Client = require("../../../index");
const { CommandInteraction, MessageEmbed, Permissions } = require("discord.js");
const { intReply, intCheck } = require("../../handlers/functions");

module.exports = {
    data: {
        name: "skipto",
        description: "To skip to a song/track in the queue.",
        options: [
            {
                name: "number",
                description: "The track number.",
                type: "NUMBER",
                required: true
            }
        ]
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

        const trackNumber = interaction.options.getNumber("number");
        if(!trackNumber) return;

        let check = await intCheck(interaction, Permissions.FLAGS.DEAFEN_MEMBERS)
        if(check !== true) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

        if(!interaction.member.voice?.channel) return await intReply(interaction, "You are not connected to a voice channel to use this command.", color);

        if(interaction.guild.me.voice.channel && interaction.member.voice?.channelId !== interaction.guild.me.voice.channelId) return await intReply(interaction, `You are not connected to ${interaction.guild.me.voice.channel} to use this command.`, color);

        const player = client.player.get(interaction.guildId);

        if(!player) return await intReply(interaction, "Nothing is playing right now.", color);

        if(player && player.state !== "CONNECTED") {
            player.destroy();
            return await intReply(interaction, `Nothing is playing right now.`, color);
        };

        if(!player.queue) return await intReply(interaction, "Nothing is playing right now.", color);
        if(!player.queue.current) return await intReply(interaction, "Nothing is playing right now.", color);

        if(!player.queue.size) return await intReply(interaction, "No songs left in the queue to skip.", color);

        if(trackNumber <= 0) return await intReply(interaction, "You've provided an invalid track/song number to skipto.", color);

        if(trackNumber > player.queue.size) return await intReply(interaction, "You've provided an invalid track/song number to skipto.", color);

        player.stop(trackNumber);
        return await interaction.editReply({
            embeds: [new MessageEmbed().setColor(color).setDescription(`**Skipped to track number \`[ ${trackNumber} ]\` in the queue.**`)]
        }).catch(() => {});
    }
}