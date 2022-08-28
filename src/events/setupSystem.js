const { Message, Permissions } = require("discord.js");
const Client = require("../../index");
const { oops, playerhandler } = require("../handlers/functions");


module.exports = {
    name: "setupSystem",

    /**
     * 
     * @param {Client} client 
     * @param {Message} message 
     */

    execute: async (client, message) => {
        let color = client.config.color ? client.config.color : "BLURPLE";
        if(!message.member.voice.channel) {
            await oops(message.channel, `You are not connected to a voice channel to queue songs.`, color);
            if(message) await message.delete().catch(() => {});
            return;
        };

        if(!message.member.voice.channel.permissionsFor(client.user).has([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK])) {
            await oops(message.channel, `I don't have enough permission to connect/speak in ${message.member.voice.channel}`);
            if(message) await message.delete().catch(() => {});
            return;
        };

        if(message.guild.me.voice.channel && message.guild.me.voice.channelId !== message.member.voice.channelId) {
            await oops(message.channel, `You are not connected to <#${message.guild.me.voice.channelId}> to queue songs`, color);
            if(message) await message.delete().catch(() => {});
            return;
        };

        let player = client.player.get(message.guildId);
        
        if(!player) player = client.player.create({
            guild: message.guildId,
            textChannel: message.channelId,
            voiceChannel: message.member.voice.channelId,
            selfDeafen: true,
            volume: 80
        });

        await playerhandler(message.content, player, message, color);
        if(message) await message.delete().catch(() => {});
    }
}