const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const { intCheck, intReply } = require("../../handlers/functions");
const prettyMilliseconds = require("pretty-ms");
const ms  = require("ms");

module.exports = {
    data: {
        name: "seek",
        description: "To seek to a position of current playing song.",
        options: [
            {
                name: "position",
                description: "The seek position.",
                type: "STRING",
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
        if(!interaction.replied) await interaction.deferReply().catch(() => {});
        let check = await intCheck(interaction, Permissions.FLAGS.DEAFEN_MEMBERS);
        if(!check) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

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

        if(!player.queue.current.isSeekable) return await intReply(interaction, `Unable to forward this track.`, color);

        const position = interaction.options.getString("position");
        const tragetPosition = Number(ms(position))
        console.log(tragetPosition);

        if(isNaN(tragetPosition)) return await intReply(interaction, `You've provided an invalid position to seek.`, color);

        if(tragetPosition <= 0 || tragetPosition >= player.queue.current.duration) return await intReply(interaction, `You've provided an invalid position to seek.`, color);

        player.seek(tragetPosition);

        return await intReply(interaction, `Seeked \`[ ${prettyMilliseconds(Number(tragetPosition))} ]\` to \`[ ${prettyMilliseconds(Number(player.position))} / ${prettyMilliseconds(Number(player.queue.current.duration))} ]\``, color);
    }
}