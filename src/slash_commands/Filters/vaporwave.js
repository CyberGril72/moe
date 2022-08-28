const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const { intCheck, intReply } = require("../../handlers/functions");

module.exports = {
    data: {
        name: "vaporwave",
        description: "To toggle the vaporwave effect/filter to the player."
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
        let check = await intCheck(interaction, Permissions.FLAGS.DEAFEN_MEMBERS);
        if(check !== true) return await intReply(interaction, `You don't have enough permission to execute this command.`, color);

        if(!interaction.member.voice.channel) return await intReply(interaction, `You are not connected to a voice channel to use this command.`, color);

        const player = client.player.get(interaction.guildId);
        if(!player) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue.current) return await intReply(interaction, `Nothing is playing right now.`, color);

        if(player && player.state !== "CONNECTED") {
            player.destroy();
            return await intReply(interaction, `Nothing is playing right now.`, color);
        };

        if(interaction.guild.me.voice.channel && interaction.guild.me.voice.channelId !== interaction.member.voice.channelId) return await intReply(interaction, `You are not connected to ${interaction.guild.me.voice.channel} to use this command.`, color);

        if(player.vaporwave) {
            player.setVaporwave(false);
            return await intReply(interaction, `Vaporwave filter/effect is now disabled.`, color);
        } else {
            player.setVaporwave(true);
            return await intReply(interaction, `Vaporwave filter/effect is now enabled.`, color);
        };
    }
}