const { Message, Permissions, MessageActionRow } = require("discord.js");
const prettyMilliseconds = require("pretty-ms");
const Client = require("../../../index");
const { good, oops, msgReply } = require("../../handlers/functions")
const lodash = require("lodash");

module.exports = {
    name: "search",
    description: "To search songs on youtube.",
    cooldown: 3,
    dev: false,
    usage: "<query>",
    aliases: ["se"],
    category: "Music",
    examples: ["search Never gonna give you up"],
    sub_commands: [],
    args: true,
    player: { active: false, voice: true, dj: false, djPerm: null },
    permissions: {
        client: [],
        author: []
    },

    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {Any[]} args
     * @param {String} prefix
     * @param {String} color
     */

    execute: async (client, message, args, prefix, color) => {
        let player = client.player.get(message.guildId);
        if(!player) player = client.player.create({
            guild: message.guildId,
            textChannel: message.channelId,
            voiceChannel: message.member.voice.channelId,
            selfDeafen: true,
            volume: 80
        });

        let query = args.join(" ");
        let s = await player.search(query, message.author);

        if(s.loadType === "LOAD_FAILED") {
            if(player && !player.queue.current) player.destroy();
            return await oops(message.channel, `No results found for ${query}`, color);
        } else if(s.loadType === "NO_MATCHES") {
            if(player && !player.queue.current) player.destroy();
            return await oops(message.channel, `No results found for ${query}`, color);
        } else if(s.loadType === "SEARCH_RESULT") {
            let map = s.tracks.map((x, i) => `> \`[ ${++i} ]\` ~ ${x.title && x.uri ? `[${x.title}](${x.uri})` : ""+x.title+""}${x.duration ? ` ~ \`[ ${prettyMilliseconds(Number(x.duration))} ]\`` : ""}${x.requester ? ` ~ [${x.requester}]` : ""}`);

            const pages = lodash.chunk(map, 8).map((x) => x.join("\n"));
            let page = 0;

            let embed1 = client.embed().setColor(color).setDescription(`**Query:** ${query}\n**Total tracks:** \`[ ${s.tracks.length} ]\`\n\n${pages[page]}\n\nType the song number that you want in 60s.`).setTitle(`Search Results`).setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }));

            let prebut1 = client.button().setCustomId("search_cmd_kekekekeke_but1").setEmoji("⬅️").setStyle("SECONDARY");

            let stopbut2 = client.button().setCustomId("search_cmd_kekekekeke_but2").setEmoji("⏹️").setStyle("SECONDARY");

            let nextbut3 = client.button().setCustomId("search_cmd_kekekekeke_but3").setEmoji("➡️").setStyle("SECONDARY");

            let col = false;
            let m;
            if(pages.length <= 1) {
                m = await message.reply({ embeds: [embed1], allowedMentions: { repliedUser: false } });
            } else {
                col = true;
                m = await message.reply({ embeds: [embed1.setFooter(`Page ${page + 1} of ${pages.length}`, message.author.displayAvatarURL({ dynamic: true }))], components: [new MessageActionRow().addComponents(prebut1, stopbut2, nextbut3)], allowedMentions: { repliedUser: false } });
            };

            let stopped = false;
            let collector;

            if(col) {
                collector = message.channel.createMessageComponentCollector({
                    filter: (b) => {
                        if(b.user.id === message.author.id) return true;
                        else {
                            b.deferUpdate().catch(() => {});
                            return false;
                        };
                    },
                    time: 60000*5,
                    idle: 60000*5/2
                });

                collector.on("end", async () => {
                    if(!m) return;
                    if(!stopped) stopped = true;
                    await m.edit({ components: [new MessageActionRow().addComponents(prebut1.setDisabled(true), stopbut2.setDisabled(true), nextbut3.setDisabled(true))] }).catch(() => {});
                });
    
                collector.on("collect", async (button) => {
                    if(!button.deferred) await button.deferUpdate().catch(() => {});
                    if(button.customId === prebut1.customId) {
                        if(!m) return;
                        page = page - 1 < 0 ? pages.length - 1 : --page;
    
                        embed1.setDescription(`**Query:** ${query}\n**Total tracks:** \`[ ${s.tracks.length} ]\`\n\n${pages[page]}\n\nType the song number that you want in 60s.`).setFooter(`Page ${page + 1} of ${pages.length}`, message.author.displayAvatarURL({ dynamic: true }));
    
                        return await m.edit({ embeds: [embed1] }).catch(() => {});
                    } else if(button.customId === stopbut2.customId) {
                        return collector.stop();
                    } else if(button.customId === nextbut3.customId) {
                        if(!m) return;
                        page = page + 1 > pages.length - 1 ? 0 : ++page;
    
                        embed1.setDescription(`**Query:** ${query}\n**Total tracks:** \`[ ${s.tracks.length} ]\`\n\n${pages[page]}\n\nType the song number that you want in 60s.`).setFooter(`Page ${page + 1} of ${pages.length}`, message.author.displayAvatarURL({ dynamic: true }));
    
                        return await m.edit({ embeds: [embed1] }).catch(() => {});
                    } else return;
                });
            };

            let awaitMessage;

            try {
                awaitMessage = await message.channel.awaitMessages({
                    filter: (m) => m.author.id === message.author.id,
                    max: 1,
                    time: 60000,
                    idle: 60000/2,
                    errors: ["time"]
                });
            } catch (e) {
                if(!stopped && col && collector) collector.stop();
                if(player && !player.queue.current) player.destroy();
                if(!m) return;
                return await m.edit({ embeds: [embed1.setTitle("Timeout!")] }).catch(() => {});
            };

            let content = awaitMessage.first().content;
            let collectedContent = null;
            if(content) collectedContent = parseInt(content);
            if(isNaN(collectedContent)) {
                if(!stopped && col && collector) collector.stop();
                if(player && !player.queue.current) player.destroy();

                return await oops(message.channel, `Search canceled due to you've provided an invalid track number.`, color);
            } else if(collectedContent > s.tracks.length) {
                if(!stopped && col && collector) collector.stop();
                if(player && !player.queue.current) player.destroy();

                return await oops(message.channel, `Search canceled due to you've provided an invalid track number.`, color);
            } else if(collectedContent <= 0) {
                if(!stopped && col && collector) collector.stop();
                if(player && !player.queue.current) player.destroy();

                return await oops(message.channel, `Search canceled due to you've provided an invalid track number.`, color);
            } else {
                if(!stopped && col && collector) collector.stop();
                if(player.state !== "CONNECTED") player.connect();
                let track = s.tracks[collectedContent - 1];
                if(player) player.queue.add(track);
                if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) return await player.play();

                return await good(message.channel, `Added ${track.title && track.uri ? `[${track.title}](${track.uri})` : track.title} to the queue.`, color);
            };
        } else if(s.loadType === "PLAYLIST_LOADED") {
            if(player.state !== "CONNECTED") player.connect();
            if(player) player.queue.add(s.tracks);
            if(player && player.state === "CONNECTED" && !player.playing && !player.paused && player.queue.totalSize === s.tracks.length) await player.play();

            return await good(message.channel, `Added \`[ ${s.tracks.length} ]\` from ${s.playlist ? `[${s.playlist.name}](${query})` : `${query}`} to the queue.`, color);
        } else if(s.loadType === "TRACK_LOADED") {
            if(player.state !== "CONNECTED") player.connect();
            if(player) player.queue.add(s.tracks[0]);
            if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

            return await msgReply(message, `Added ${s.tracks[0].title && s.tracks[0].uri ? `[${s.tracks[0].title}](${s.tracks[0].uri})` : s.tracks[0].title} to the queue.`, color);
        } else {
            if(player && !player.queue.current) player.destroy();
            return await oops(message.channel, `No results found for ${query}`, color);
        };
    }
}