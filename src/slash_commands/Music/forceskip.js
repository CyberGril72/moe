const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const { intCheck, intReply, autoplay } = require("../../handlers/functions");
const db = require("../../utils/schemas/247");

module.exports = {
    data: {
        name: "forceskip",
        description: "To force skip the current playing song."
    },

    dj: true,

    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String} color
     */

    execute: async (client, interaction, color) => {
        if(!interaction.replied) await interaction.deferReply().catch(() => {});
        let check = await intCheck(interaction, Permissions.FLAGS.DEAFEN_MEMBERS);
        if(!check) return await intReply(interaction, `You don't enough permission to use this command.`, color);

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

        let data = await db.findOne({ _id: interaction.guildId });

        if(!player.queue.size) {
            if(player.get("autoplay")) {
                let au = await autoplay(player, interaction.user);
                if(au === "failed") {
                    if(!data) {
                        player.destroy();
                        return await intReply(interaction, `Force skipped and left the voice channel due to no more songs left in the queue.`, color);
                    } else {
                        if(data.mode) {
                            player.stop();
                            return await intReply(interaction, `Force skipped [**__${player.queue.current.title}__**](${player.queue.current.uri})`, color);
                        } else {
                            player.destroy();
                            return await intReply(interaction, `Force skipped and left the voice channel due to no more songs left in the queue.`, color);
                        };
                    };
                } else {
                    player.stop();
                    return await intReply(interaction, `Force skipped [__${player.queue.current.title}__](${player.queue.current.uri})`, color);
                };
            } else {
                if(!data) {
                    player.destroy();
                    return await intReply(interaction, `Force skipped and left the voice channel due to no more songs left in the queue.`, color);
                } else {
                    if(data.mode) {
                        player.stop();
                        return await intReply(interaction, `Force skipped [__${player.queue.current.title}__](${player.queue.current.uri})`, color);
                    } else {
                        player.destroy();
                        return await intReply(interaction, `Force skipped and left the voice channel due to no more songs left in the queue.`, color);
                    };
                };
            };
        } else {
            player.stop();
            return await intReply(interaction, `Skipped [__${player.queue.current.title}__](${player.queue.current.uri})`, color);
        };
    }
}