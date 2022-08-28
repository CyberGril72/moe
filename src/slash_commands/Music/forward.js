const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const { intReply, intCheck } = require("../../handlers/functions");
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    data: {
        name: "forward",
        description: "To forward the current playing song.",
        options: [
            {
                name: "amount",
                description: "Th forward amount. (seconds)",
                type: "NUMBER",
                required: false
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

        let forwardPosition = 10000;

        if(interaction.options.getNumber("amount")) forwardPosition = Number(1000*interaction.options.getNumber("amount"));

        if(forwardPosition <= 0 || forwardPosition > player.queue.current) return await intReply(interaction, `Cannot forward any futher more.`, color);

        let x = player.position + forwardPosition;

        if(x > player.queue.current.duration) return await intReply(interaction, `Cannot forward any futher more.`, color);

        player.seek(x);

        return await intReply(interaction, `Forwarded \`[ ${prettyMilliseconds(Number(forwardPosition))} ]\` to \`[ ${prettyMilliseconds(Number(player.position))} / ${prettyMilliseconds(Number(player.queue.current.duration))} ]\``, color);
    }
}