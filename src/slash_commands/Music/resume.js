const Client = require("../../../index");
const { CommandInteraction, MessageEmbed, Permissions } = require("discord.js");
const { intReply, intCheck } = require("../../handlers/functions");

module.exports = {
    data: {
        name: "resume",
        description: "To resume a paused player."
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
        if(!check) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

        if(!interaction.member.voice.channel) return await intReply(interaction, "You are not connected to  a voice channel to use this command.", color);

        let player = client.player.get(interaction.guildId);
        if(!player) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue.current) return await intReply(interaction, `Nothing is playing right now.`, color);

        if(player && player.state !== "CONNECTED") {
            player.destroy();
            return await intReply(interaction, `Nothing is playing right now.`, color);
        };

        if(interaction.guild.me.voice.channel && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) return await intReply(interaction, `You are to connected to ${interaction.guild.me.voice.channel} to use this command.`, color);

        if(player.paused) {
            player.pause(false);
            return await interaction.editReply({
                embeds: [client.embed().setColor(color).setDescription(`[${player.queue.current.title}](${player.queue.current.uri}) is now resumed.`)]
            }).catch(() => {});
        } else {
            return await intReply(interaction, `[${player.queue.current.title}](${player.queue.current.uri}) is not paused to resume.`, color);
        };
    }
}