const { Player } = require("erela.js");
const { Client, MessageEmbed } = require("discord.js");
const db = require("../../utils/schemas/setup");
const { trackStartEventHandler } = require("../../handlers/functions");
const db2 = require("../../utils/schemas/announce");
const db3 = require("../../utils/schemas/users");
const db4 = require("../../utils/schemas/guilds");

module.exports = {
    name: "trackStart",

    /**
     * 
     * @param {Client} client 
     * @param {Player} player 
     * @param {import("erela.js").Track | import("erela.js/structures/Player").UnresolvedTrack} track 
     * 
     */

    execute: async (client, player, track) => {
        let guild = client.guilds.cache.get(player.guild);
        if(!guild) return;
        let channel = guild.channels.cache.get(player.textChannel);
        if(!channel) return;

        let guildData = await db4.findOne({ _id: guild.id });
        if(!guildData) {
            guildData = new db4({
                _id: guild.id,
                guildName: channel.guild.name,
                songsRan: `1`
            });

            await guildData.save();
        } else {
            guildData.songsRan = `${parseInt(guildData.songsRan) + 1}`;
            await guildData.save();
        };

        if(track.requester && client.user.id !== track.requester.id) {
            let userData = await db3.findOne({ _id: track.requester.id });
            if(!userData) {
                userData = new db3({
                    _id: track.requester.id,
                    userName: track.requester.username,
                    userTag: track.requester.tag,
                    songsRan: `1`
                });

                await userData.save();
            } else {
                userData.songsRan = `${parseInt(userData.songsRan) + 1}`;
                await userData.save();
            };
        };

        let color = client.config.color ? client.config.color : "BLURPLE";

        let data = await db.findOne({ _id: guild.id });
        let data2 = await db2.findOne({ _id: guild.id });

        if(data && data.channel) {
            let textChannel = guild.channels.cache.get(data.channel);
            let id = data.message;

            if(channel.id === textChannel.id) {
                if(data2 && data2.mode && data2.channel) {
                    channel = guild.channels.cache.get(data2.channel);

                    if(data2.prunning) {
                        let me1;
                        if(channel && channel.sendable && channel.id !== textChannel.id) me1 = await channel.send({ embeds: [new MessageEmbed().setColor(color).setDescription(`Now playing [${track.title}](${track.uri}) ~ [${track.requester}]`)] });

                        if(me1) await player.setNowplayingMessage(me1);
                    } else {
                        if(channel && channel.id !== textChannel.id && channel.sendable) await channel.send({ embeds: [new MessageEmbed().setColor(color).setDescription(`Now playing [${track.title}](${track.uri}) ~ [${track.requester}]`)] }).catch(() => {});
                    };
                };

                return await trackStartEventHandler(id, textChannel, player, track, client, color);
            } else {
                await trackStartEventHandler(id, textChannel, player, track, client, color);
            };
        };

        if(data2 && !data2.mode) return;
        if(data2 && data2.channel) channel = guild.channels.cache.get(data2.channel);
        
        if(data2 && data2.prunning) {
            
            const m = await channel.send({ embeds: [new MessageEmbed().setColor(color).setDescription(`Now playing [${track.title}](${track.uri}) ~ [${track.requester}]`)] });

            return await player.setNowplayingMessage(m);
        };

        await channel.send({ embeds: [new MessageEmbed().setColor(color).setDescription(`Now playing [${track.title}](${track.uri}) ~ [${track.requester}]`)] });
    }
};
