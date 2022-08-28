const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const { intReply } = require("../../handlers/functions");
const db = require("../../utils/schemas/247");

module.exports = {
    data: {
        name: "247",
        description: "To toggle enable/disable 24/7 mode."
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
        if(!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

        if(!interaction.member.voice.channel) return await intReply(interaction, `You are not connected to a voice channel to use this command.`, color);

        if(interaction.guild.me.voice.channel && interaction.guild.me.voice.channelId !== interaction.member.voice.channelId) return await intReply(interaction, `You are not connected to <#${interaction.guild.me.voice.channelId}> to use this command.`, color);

        let player = client.player.get(interaction.guildId);
        let data = await db.findOne({ _id: interaction.guildId });

        if(!data) {
            data = new db({
                _id: interaction.guildId,
                mode: true,
                textChannel: interaction.channelId,
                voiceChannel: interaction.member.voice.channelId,
                moderator: interaction.user.id,
                lastUpdated: Math.round(Date.now()/1000)
            });

            await data.save();

            if(!player) player = client.player.create({ guild: interaction.guildId, textChannel: interaction.channelId, voiceChannel: interaction.member.voice.channelId, selfDeafen: true, volume: 80 });

            if(player.state !== "CONNECTED") player.connect();

            return await intReply(interaction, `24/7 mode is now enabled.`, color);
        } else {
            if(data.mode) {
                data.mode = false;
                data.moderator = interaction.user.id;
                data.lastUpdated = Math.round(Date.now()/1000);

                await data.save();
                return await intReply(interaction, `24/7 mode is now disabled.`, color);
            } else {
                data.mode = true;
                data.textChannel = interaction.channelId;
                data.voiceChannel = interaction.member.voice.channelId;
                data.moderator = interaction.user.id;
                data.lastUpdated = Math.round(Date.now()/1000);

                await data.save();

                if(!player) player = client.player.create({ guild: interaction.guildId, textChannel: interaction.channelId, voiceChannel: interaction.member.voice.channelId, selfDeafen: true, volume: 80 });

                if(player.state !== "CONNECTED") player.connect();

                return await intReply(interaction, `24/7 mode is now enabled.`, color);
            };
        };
    }
}
