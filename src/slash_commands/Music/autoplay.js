const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const { intReply, intCheck } = require("../../handlers/functions");

module.exports = {
    data: {
        name: "autoplay",
        description: "To toggle enable/disable autoplay when the queue ends."
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
        let check = await intCheck(interaction, Permissions.FLAGS.DEAFEN_MEMBERS)
        if(check !== true) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

        if(!interaction.member.voice.channel) return await intReply(interaction, `You are not connected to a voice channel to use this command.`, color);

        const player = client.player.get(interaction.guildId);
        if(!player) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue.current) return await intReply(interaction, `Nothing is playing right now.`, color);

        if(player && player.state !== "CONNECTED") {
            player.destroy();
            return await intReply(interaction, `Nothing is playing right now.`, color);
        };

        if(interaction.guild.me.voice.channel && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) return await intReply(interaction, `You are to connected to ${interaction.guild.me.voice.channel} to use this command.`, color);

        const autoplay = player.get("autoplay");

        if(!autoplay) {
            player.set("autoplay", true);
            return await intReply(interaction, `Autoplay is now enabled.`, color);
        } else {
            player.set("autoplay", false);
            return await intReply(interaction, `Autoplay is now disabled.`, color);
        };
    }
}