const Client = require("../../../index");
const { CommandInteraction } = require("discord.js");
const { intReply } = require("../../handlers/functions");
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    data: {
        name: "addprevious",
        description: "To add the previously played song to the queue."
    },

    dj: false,

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {String} color 
     */

    execute: async (client, interaction, color) => {
        if(!interaction.replied) await interaction.deferReply().catch(() => {});

        if(!interaction.member.voice.channel) return await intReply(interaction, `You are not connected to a voice channel to use this command.`, color);

        let player = client.player.get(interaction.guildId);
        if(!player) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue.current) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue.previous) return await intReply(interaction, `No previously played songs found for this server.`, color);

        if(player && player.state !== "CONNECTED") {
            player.destroy();
            return await intReply(interaction, `Nothing is playing right now.`, color);
        };

        if(player.state !== "CONNECTED") player.connect();
        if(player) player.queue.add(player.queue.previous);
        if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

        return await intReply(interaction, `Added [__${player.queue.previous.title}__](${player.queue.previous.uri}) ~ \`[ ${prettyMilliseconds(Number(player.queue.previous.duration))} ]\``, color);
    }
}