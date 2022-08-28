const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const { intReply, intCheck, moveArray } = require("../../handlers/functions");

module.exports = {
    data: {
        name: "jumpto",
        description: "To jump to a track in the queue.",
        options: [
            {
                name: "track_number",
                description: "The track number.",
                type: "NUMBER",
                required: true
            }
        ]
    },

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {String} color 
     */

    execute: async (client, interaction, color) => {
        if(!interaction.replied) await interaction.deferReply().catch(() => {});

        if(!interaction.member.voice.channel) return await intReply(interaction, `You are not connected to a voice channel to use this command.`, color);

        if(interaction.guild.me.voice.channel && interaction.guild.me.voice.channelId !== interaction.member.voice.channelId) return await intReply(interaction, `You are not connected to <#${interaction.guild.me.voice.channelId}> to use this command.`, color);

        const player = client.player.get(interaction.guildId);
        if(!player) return await intReply(interaction, `Nothing is playing right now!`, color);
        if(!player.queue) return await intReply(interaction, `Nothing is playing right now!`, color);
        if(!player.queue.current) return await intReply(interaction, `Nothing is playing right now!`, color);
        if(!player.queue.size) return await intReply(interaction, `No tracks left in the queue to jump.`, color);

        let trackNum = interaction.options.getNumber("track_number");
        if(!trackNum) return await intReply(interaction, `Please provide a track number to jump to.`, color);

        if(trackNum > player.queue.size) return await intReply(interaction, `Track number shouldn't be higher than the queue's length.`, color);

        if(trackNum <= 0) return await intReply(interaction, `Track number shouldn't lower than or equal to 0.`, color);

        let track = player.queue[trackNum - 1];

        if(trackNum === 1) {
            player.stop();
            return await intReply(interaction, `Jumped to [${track.title}](${track.uri})`, color);
        } else {
            const move = moveArray(player.queue, trackNum - 1, 0);
            player.queue.clear();
            player.queue.add(move);

            if(player.queue.current.title !== track.title || player.queue.current.uri !== track.uri) player.stop();

            return await intReply(interaction, `Jumped to [${track.title}](${track.uri})`, color);
        };
    }
}