const Client = require("../../index");
const { VoiceState, Permissions } = require("discord.js");
const { oops } = require("../handlers/functions");
const db = require("../utils/schemas/247");

module.exports = {
    name: "voiceStateUpdate",

    /**
     * @param {Client} client
     * @param {VoiceState} oldState
     * @param {VoiceState} newState
     */

    execute: async (client, oldState, newState) => {
        const player = client.player.get(newState.guild.id);
        if(!player) return;

        if(newState.id === client.user.id && !newState.serverDeaf && newState.guild.me.permissions.has(Permissions.FLAGS.DEAFEN_MEMBERS)) await newState.setDeaf(true);
        if(newState.id === client.user.id && newState.serverMute && !player.paused) player.pause(true);
        if(newState.id === client.user.id && !newState.serverMute && player.paused) player.pause(false);

        const textChannel = newState.guild.channels.cache.get(player.textChannel);
        let voiceChannel = newState.guild.channels.cache.get(player.voiceChannel);

        if(newState.id === client.user.id && newState.channelId === null) return;

        if(oldState.id === client.user.id && newState.id === client.user.id && oldState.channelId !== newState.channelId) {
            if(player && player.voiceChannel !== newState.channelId) player.changeVoiceChannel(newState.channelId);
            voiceChannel = newState.guild.channels.cache.get(newState.channelId);
        };

        if(!voiceChannel) return;

        if(voiceChannel.members.filter((x) => !x.user.bot).size <= 0) {
            let data = await db.findOne({ _id: newState.guild.id });
            if(!data) {
                setTimeout(async () => {
                    let playerVoiceChannel = newState.guild.channels.cache.get(player.voiceChannel);
                    if(player && playerVoiceChannel && playerVoiceChannel.members.filter((x) => !x.user.bot).size <= 0) {
                        if(textChannel) await oops(textChannel, `Leaving the voice channel due to inactivity.`);

                        return player.destroy();
                    }
                }, 60000);;
            } else {
                if(data.mode) return;
                setTimeout(async () => {
                    let playerVoiceChannel2 = newState.guild.channels.cache.get(player.voiceChannel);
                    if(player && playerVoiceChannel2 && playerVoiceChannel2.members.filter((x) => !x.user.bot).size <= 0) {
                        if(textChannel) await oops(textChannel, `Leaving the voice channel due to inactivity.`);

                        return player.destroy();
                    }
                }, 60000);
            };
        };
    }
}