const Client = require("../../../index");
const { intReply, intCheck, moveArray } = require("../../handlers/functions");
const { CommandInteraction, Permissions } = require("discord.js");

module.exports = {
    data: {
        name: "playprevious",
        description: "Plays the previously played song."
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

        let ch = await intCheck(interaction, Permissions.FLAGS.DEAFEN_MEMBERS);
        if(!ch) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

        const player = client.player.get(interaction.guildId);
        if(!player) return await intReply(interaction, `Nothing is playing right now!`, color);
        if(!player.queue) return await intReply(interaction, `Nothing is playing right now!`, color);
        if(!player.queue.previous) return await intReply(interaction, `No previously played track found!`, color);

        if(interaction.guild.me.voice.channel && interaction.guild.me.voice.channelId !== interaction.member.voice.channelId) return await intReply(interaction, `You are not connected <#${interaction.guild.me.voice.channelId}> to use this command.`, color);

        if(player.state !== "CONNECTED") player.connect();
        player.queue.add(player.queue.previous);

        if(!player.queue.size) {
            if(player.queue.current) player.stop();
            if(player && player.state === "CONNECTED" && !player.playing && !player.paused) await player.play();

            return await intReply(interaction, `Added [${player.queue.previous.title}](${player.queue.previous.uri}) to the queue.`, color);
        } else {
            if(player.queue.size === 1) {
                if(player.queue.current) player.stop();
                if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                return await intReply(interaction, `Added [${player.queue.previous.title}](${player.queue.previous.uri}) to the queue.`, color);
            } else {
                const move = moveArray(player.queue, player.queue.length - 1, 0);
                player.queue.clear();
                player.queue.add(move);
                player.stop();

                return await intReply(interaction, `Added [${player.queue.previous.title}](${player.queue.previous.uri}) to the queue.`, color);
            };
        };
    }
}