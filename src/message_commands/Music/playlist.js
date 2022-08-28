const { Message, Permissions, MessageActionRow } = require("discord.js");
const Client = require("../../../index");
const { oops, good, invalidArgs, intReply, shuffleArray, moveArray, msgReply } = require("../../handlers/functions");
const db = require("../../utils/schemas/playlists");
const lodash = require("lodash");
const prettyMilliseconds = require("pretty-ms");
const { isNumber } = require("lodash");

module.exports = {
    name: "playlist",
    description: "Gets the user's playlist.",
    cooldown: 3,
    dev: false,
    usage: "<sub_command>",
    aliases: ["pl"],
    category: "Music",
    examples: ["playlist create rickroll collections", "playlist add Never gonna givr you up", "playlist addnowplaying", "playlist addqueue", "playlist load all", "playlist load track 4", "playlist remove track 3", "playlist remove dupes", "playlist remove all", "playlist shuffle", "playlist list", "playlist delete", "move track 6 2"],
    sub_commands: ["create <name>", "add <query>", "addnowplaying", "addqueue", "load all", "load track <number>", "remove track <number>", "remove dupes", "remove all", "shuffle", "list", "delete", "move track <number> <to_position>"],
    args: true,
    player: { active: false, voice: false, dj: false, djPerm: null },
    permissions: {
        client: [],
        author: []
    },

    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     * @param {String} prefix
     * @param {String} color
     */

    execute: async (client, message, args, prefix, color) => {
        let data = await db.findOne({ _id: message.author.id });
        if(["create", "c"].includes(args[0])) {
            if(data) return await oops(message.channel, `You've already created a playlist for yourself.`, color);

            if(!args[1]) return await oops(message.channel, `Playlist name is required to create a playlist.`, color);
            let playlistName = args.splice(1).join(" ");
            data = new db({
                _id: message.author.id,
                playlistName: playlistName,
                userName: message.author.username,
                createdOn: Math.round(Date.now()/1000)
            });

            await data.save();
            return await good(message.channel, `Successfully created a playlist for you named __${playlistName}__`, color);
        } else if(["delete", "d"].includes(args[0])) {
            if(!data) return await oops(message.channel, `You've not created a playlist to delete.`, color);
            const embed1 = client.embed().setColor(color).setDescription(`Press **Confirm** to delete your playlist __${data.playlistName}__.`, color);

            const cButton = client.button().setCustomId("playlist_cmd_kekekeke").setLabel("Confirm").setStyle("PRIMARY");

            const m = await message.reply({ embeds: [embed1], components: [new MessageActionRow().addComponents(cButton)] });

            const collector = m.createMessageComponentCollector({
                filter: (b) => b.user.id === message.author.id && b.customId === cButton.customId ? true : false && b.deferUpdate().catch(() => {}),
                max: 1,
                time: 60000,
                idle: 30000
            });

            collector.on("end", async () => {
                if(!m) return;
                await m.edit({ components: [new MessageActionRow().addComponents(cButton.setDisabled(true))] }).catch(() => {});
            });

            collector.on("collect", async (button) => {
                if(!button.replied) await button.deferReply({ ephemeral: true }).catch(() => {});
                if(data) await data.delete();
                return await intReply(button, `Successfully deleted your playlist.`, color);
            });
        } else if(["remove", "r"].includes(args[0])) {
            if(!data) return await oops(message.channel, `You've not created a plylist to use this sub command.`, color);
            if(data.playlist.length <= 0) return await oops(message.channel, `Your playlist doesn't have any tracks left in it to remove.`, color);

            if(!args[1]) return await invalidArgs("playlist", message, `Please provide a sub command options, track, dupes or all.`, client);

            if(["track", "t", "song", "s"].includes(args[1])) {
                if(!args[2]) return await oops(message.channel, `Please provide a track number in your playlist to remove.`, color);

                let trackNumber = parseInt(args[2]);
                if(isNaN(trackNumber)) return await oops(message.channel, `Track number must be a number.`, color);
                if(trackNumber <= 0) return await oops(message.channel, `Track number cannot be lower than or equal to 0.`, color);
                if(trackNumber > data.playlist.length) return await oops(message.channel, `Track number cannot be higher than your playlist length.`, color);

                data.playlist.splice(trackNumber - 1, 1);
                await data.save();

                return await good(message.channel, `Removed track number \`[ ${trackNumber} ]\` from your playlist.`, color);
            } else if(["dupes", "dupe", "d"].includes(args[1])) {
                let dump = [];
                let count = 0;

                for (let i of data.playlist) {
                    if(dump.length <= 0) {
                        dump.push(i);
                    } else {
                        let j = dump.find((x) => x.title === i.title || x.uri === i.uri);
                        if(!j) {
                            dump.push(i);
                        } else {
                            ++count;
                        };
                    };
                };

                if(count <= 0) return await oops(message.channel, `No duplicated tracks found in your playlist to remove.`, color);

                data.playlist.splice(0);
                for await (const o of dump) data.playlist.push(o);
                await data.save();

                return await oops(message.channel, `Removed \`[ ${count} ]\` duplicated track(s) from your playlist.`, color);
            } else if(["all", "a"].includes(args[1])) {
                data.playlist.splice(0);
                await data.save();

                return await good(message.channel, `Removed all the tracks from your playlist.`, color);
            } else return await invalidArgs("playlist", message, `Please provide a sub command options, track or dupes or all.`, client);
        } else if(["load", "l"].includes(args[0])) {
            if(!data) return await oops(message.channel, `You've not created a plylist to use this sub command.`, color);
            if(data.playlist.length <= 0) return await oops(message.channel, `Your playlist doesn't have any tracks left in it to load.`, color);

            if(!message.member.voice.channel) return await oops(message.channel, `You are not connetced to a voice channel to use this command.`, color);

            let player = client.player.get(message.guildId);
            if(player && player.state === "CONNECTED" && player.voiceChannel !== message.member.voice.channelId) return await oops(message.channel, `You are not connected to <#${player.voiceChannel}> to use this command.`, color);

            if(!player) player = client.player.create({
                guild: message.guildId,
                textChannel: message.channelId,
                voiceChannel: message.member.voice.channelId,
                volume: 80,
                selfDeafen: true
            });

            if(args[1] && ["track", "t", "song", "s"].includes(args[1])) {
                if(!args[2]) return await oops(message.channel, `Please provide a track number that you want to load.`, color);

                let trackNumber = parseInt(args[2]);
                if(isNaN(trackNumber)) return await oops(message.channel, `Track number must be a number.`, color);
                if(trackNumber <= 0) return await oops(message.channel, `Track number cannot be lower than or equal to 0.`, color);
                if(trackNumber > data.playlist.length) return await oops(message.channel, `Track number cannot be higher than your playlist length.`, color);

                let track = data.playlist[trackNumber - 1];
                if(!track) return await oops(message.channel, `Unable to find the track number \`[ ${trackNumber} ]\` in your playlist.`, color);

                let s = await player.search(track.uri ? track.uri : track.title, message.author);
                if(s.loadType === "TRACK_LOADED") {
                    if(player && player.state !== "CONNECTED") player.connect();
                    if(player) player.queue.add(s.tracks[0]);
                    if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) return player.play();

                    return await good(message.channel, `Added ${s.tracks[0].title && s.tracks[0].uri ? `[${s.tracks[0].title}](${s.tracks[0].uri})` : `**${s.tracks[0].title}**`} to the queue.`, color);
                } else if(s.loadType === "SEARCH_RESULT") {
                    if(player && player.state !== "CONNECTED") player.connect();
                    if(player) player.queue.add(s.tracks[0]);
                    if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) return await player.play();

                    return await good(message.channel, `Added ${s.tracks[0].title && s.tracks[0].uri ? `[${s.tracks[0].title}](${s.tracks[0].uri})` : `**${s.tracks[0].title}**`} to the queue.`, color);
                } else {
                    if(player && !player.queue.current) player.destroy();
                    return await oops(message.channel, `Unable to load the track number \`[ ${trackNumber} ]\` in your playlist.`, color);
                };
            } else {
                if(!player) return;
                let count = 0;

                const m = await message.reply({ embeds: [client.embed().setColor(color).setDescription(`Adding \`[ ${data.playlist.length} ]\` track(s) from your playlist __${data.playlistName}__ to the queue.`)] });

                for await (const track of data.playlist) {
                    if(!player) return;
                    let s = await player.search(track.uri ? track.uri : track.title, message.author);
                    if(s.loadType === "TRACK_LOADED") {
                        if(player.state !== "CONNECTED") player.connect();
                        if(player) player.queue.add(s.tracks[0]);
                        if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();
                        ++count;
                    } else if(s.loadType === "SEARCH_RESULT") {
                        if(player.state !== "CONNECTED") player.connect();
                        if(player) player.queue.add(s.tracks[0]);
                        if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();
                        ++count;
                    };
                };

                if(player && !player.queue.current) player.destroy();
                if(count <= 0 && m) return await m.edit({ embeds: [client.embed().setColor(color).setDescription(`Couldn't add any tracks from your playlist __${data.playlistName}__ to the queue.`)] }).catch(() => {});

                if(m) return await m.edit({ embeds: [client.embed().setColor(color).setDescription(`Added \`[ ${count} ]\` track(s) from your playlist __${data.playlistName}__ to the queue.`)] }).catch(() => {});
            };
        } else if(["list", "li"].includes(args[0])) {
            if(!data) return await oops(message.channel, `You've not created a plylist to use this sub command.`, color);
            if(data.playlist.length <= 0) return await oops(message.channel, `Your playlist doesn't have any tracks left in it to load.`, color);

            let tracks = data.playlist.map((x, i) => `> \`[ ${++i} ]\` ~ ${x.title && x.uri ? `[${x.title}](${x.uri})` : `${x.title}`}${x.duration ? ` ~ \`[ ${prettyMilliseconds(Number(x.duration))} ]\`` : ""}`);
            
            const pages = lodash.chunk(tracks, 10).map((x) => x.join("\n"));
            let page = 0;

            const embed1 = client.embed().setTitle(`${message.author.username}'s Playlist`).setColor(color).setDescription(`**Playlist Name:** ${data.playlistName}\n**Total tracks:** \`[ ${data.playlist.length} ]\`\n\n${pages[page]}`).setFooter({text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })});

            if(pages.length <= 1) {
                return await message.reply({ embeds: [embed1] }).catch(() => {});
            } else {
                embed1.setFooter({text: `Page ${page + 1} of ${pages.length}`,iconURL: message.author.displayAvatarURL({ dynamic: true })});

                let previousbut = client.button().setCustomId("playlist_cmd_ueuwbdl_uwu-previous").setEmoji(client.config.emojis.previous).setStyle(client.config.button.styles.grey);

                let nextbut = client.button().setCustomId("playlist_cmd_uwu-next").setEmoji(client.config.emojis.next).setStyle("SECONDARY");

                let stopbut = client.button().setCustomId("playlist_cmd_uwu-stop").setEmoji(client.config.emojis.stop).setStyle("SECONDARY");

                const row1 = new MessageActionRow().addComponents(previousbut, stopbut, nextbut);

                const m = await message.reply({ embeds: [embed1], components: [row1] });

                const collector = m.createMessageComponentCollector({
                    filter: (b) => b.user.id === message.author.id ? true : false && b.deferUpdate().catch(() => {}),
                    time: 60000*5,
                    idle: 60000*5/2
                });

                collector.on("end", async () => {
                    if(!m) return;
                    await m.edit({ components: [new MessageActionRow().addComponents(previousbut.setDisabled(true), stopbut.setDisabled(true), nextbut.setDisabled(true))] }).catch(() => {});
                });

                collector.on("collect", async (button) => {
                    if(!button.deferred) await button.deferUpdate().catch(() => {});
                    if(button.customId === previousbut.customId) {
                        page = page - 1 < 0 ? pages.length - 1 : --page;
                        if(!m) return;

                        embed1.setFooter({text: `Page ${page + 1} of ${pages.length}`,iconURL: message.author.displayAvatarURL({ dynamic: true })}).setDescription(`**Playlist Name:** ${data.playlistName}\n**Total tracks:** \`[ ${data.playlist.length} ]\`\n\n${pages[page]}`);

                        return await m.edit({ embeds: [embed1] }).catch(() => {});
                    } else if(button.customId === stopbut.customId) {
                        return collector.stop();
                    } else if(button.customId === nextbut.customId) {
                        page = page + 1 >= pages.length ? 0 : ++page;
                        if(!m) return;

                        embed1.setFooter({text: `Page ${page + 1} of ${pages.length}`,iconURL: message.author.displayAvatarURL({ dynamic: true })}).setDescription(`**Playlist Name:** ${data.playlistName}\n**Total tracks:** \`[ ${data.playlist.length} ]\`\n\n${pages[page]}`);

                        return await m.edit({ embeds: [embed1] }).catch(() => {});
                    } else return;
                });
            };
        } else if(["shuffle", "s"].includes(args[0])) {
            if(!data) return await oops(message.channel, `You've not created a plylist to use this sub command.`, color);
            if(data.playlist.length <= 0) return await oops(message.channel, `Your playlist doesn't have any tracks left in it to load.`, color);

            shuffleArray(data.playlist);
            await data.save();

            return await good(message.channel, `Shuffled your playlist __${data.playlistName}__`, color)
        } else if(["add", "a"].includes(args[0])) {
            if(!data) return await oops(message.channel, `You've not created a plylist to use this sub command.`, color);

            if(data.playlist.length >= 100) return await oops(message.channel, `Maximum amount of adding track to your playlist reached.`, color);

            if(!args[1]) return await oops(message.channel, `Please provide a search query to add.`, color);
            let query = args.splice(1).join(" ");

            let player = client.player.get(message.guildId);
            if(!player) player = client.player.create({
                guild: message.guildId,
                textChannel: message.channelId
            });

            let s = await player.search(query, message.author);
            if(s.loadType === "PLAYLIST_LOADED") {
                for (const track of s.tracks) data.playlist.push(track);
                await data.save();
                if(player && !player.queue.current) player.destroy();
                return await good(message.channel, `Added \`[ ${s.tracks.length} ]\` from [${s.playlist.name}](${query}) to your playlist.`, color);
            } else if(s.loadType === "TRACK_LOADED") {
                data.playlist.push(s.tracks[0]);
                await data.save();
                if(player && !player.queue.current) player.destroy();
                return await good(message.channel, `Added ${s.tracks[0].title && s.tracks[0].uri ? `[${s.tracks[0].title}](${s.tracks[0].uri})` : s.tracks[0].title} to your playlist.`, color);
            } else if(s.loadType === "SEARCH_RESULT") {
                data.playlist.push(s.tracks[0]);
                await data.save();
                if(player && !player.queue.current) player.destroy();
                return await good(message.channel, `Added ${s.tracks[0].title && s.tracks[0].uri ? `[${s.tracks[0].title}](${s.tracks[0].uri})` : s.tracks[0].title} to your playlist.`, color);
            } else {
                if(player && !player.queue.current) player.destroy();
                return await oops(message.channel, `No results found for ${query}`, color);
            };
        } else if(["addqueue", "addq"].includes(args[0])) {
            if(!data) return await oops(message.channel, `You've not created a plylist to use this sub command.`, color);

            if(data.playlist.length >= 100) return await oops(message.channel, `Maximum amount of adding track to your playlist reached.`, color);

            let player = client.player.get(message.guildId);
            if(!player) return await oops(message.channel, `Nothing is playing right now.`, color);
            if(!player.queue) return await oops(message.channel, `Nothing is playing right now.`, color);
            if(!player.queue.current) return await oops(message.channel, `Nothing is playing right now.`, color);

            for (const track of player.queue) data.playlist.push(track);
            await data.save();

            return await good(message.channel, `Added \`[ ${player.queue.size} ]\` from the queue to your playlist.`, color);
        } else if(["addnowplaying", "addnp"].includes(args[0])) {
            if(!data) return await oops(message.channel, `You've not created a plylist to use this sub command.`, color);

            if(data.playlist.length >= 100) return await oops(message.channel, `Maximum amount of adding track to your playlist reached.`, color);

            let player = client.player.get(message.guildId);
            if(!player) return await oops(message.channel, `Nothing is playing right now.`, color);
            if(!player.queue) return await oops(message.channel, `Nothing is playing right now.`, color);
            if(!player.queue.current) return await oops(message.channel, `Nothing is playing right now.`, color);

            const { title, uri } = player.queue.current;
            data.playlist.push(player.queue.current);
            await data.save();

            return await good(message.channel, `Added ${title && uri ? `[${title}](${uri})` : title} to your playlist.`, color);
        } else if(["move", "m", "movetrack"].includes(args[0])) {
            if(!data) return await oops(message.channel, `You haven't created a playlist yet to use this sub command.`, color)
            if(data.playlist.length <= 0) return await oops(message.channel, `Your playlist doesn't have any tracks left in it to load.`, color);
            if(!args[1]) return await oops(message.channel, `Please provide a valid sub command options, track number, to position`);

            if(["track", "t"].includes(args[1])) {
                if(!args[2]) return await oops(message.channel, `Please provide a track number to move.`, color);
                if(!args[3]) return await oops(message.channel, `Please provide a to position to move the track.`, color);

                let trackNumber = parseInt(args[2]);
                let toPosition = parseInt(args[3]);

                if(isNaN(trackNumber)) return await oops(message.channel, `Track number must be a valid number.`, color);
                if(isNaN(toPosition)) return await oops(message.channel, `To positon must be a valid number.`, color);
                if(trackNumber <= 0) return await oops(message.channel, `Track number shouldn't be lower than or equal to 0.`, color);
                if(toPosition <= 0) return await oops(message.channel, `To position shouldn't be lower than or equal to 0.`, color);
                if(trackNumber > data.playlist.length) return await oops(message.channel, `Track number shouldn't be higher than your playlist tracks length.`, color);
                if(toPosition > data.playlist.length) return await oops(message.channel, `To positon shouldn't be higher than your playlist tracks length.`, color);

                let move = moveArray(data.playlist, trackNumber - 1, toPosition - 1);
                data.playlist.splice(0);
                for (const i of move) data.playlist.push(i);
                await data.save();

                return await msgReply(message, `Moved track number \`[ ${trackNumber} ]\` to \`[ ${toPosition} ]\` in your playlist.`, color);
            } else {
                if(!args[2]) return await oops(message.channel, `Please provide a to position to move the track.`, color);

                let trackNumber = parseInt(args[1]);
                let toPosition = parseInt(args[2]);

                if(isNaN(trackNumber)) return await oops(message.channel, `Track number must be a valid number.`, color);
                if(isNaN(toPosition)) return await oops(message.channel, `To positon must be a valid number.`, color);
                if(trackNumber <= 0) return await oops(message.channel, `Track number shouldn't be lower than or equal to 0.`, color);
                if(toPosition <= 0) return await oops(message.channel, `To position shouldn't be lower than or equal to 0.`, color);
                if(trackNumber > data.playlist.length) return await oops(message.channel, `Track number shouldn't be higher than your playlist tracks length.`, color);
                if(toPosition > data.playlist.length) return await oops(message.channel, `To positon shouldn't be higher than your playlist tracks length.`, color);
                if(trackNumber === toPosition) return await oops(message.channel, `The track number that you've provided is already at this position.`, color);

                let move = moveArray(data.playlist, trackNumber - 1, toPosition - 1);
                data.playlist.splice(0);
                for (const i of move) data.playlist.push(i);
                await data.save();

                return await msgReply(message, `Moved track number \`[ ${trackNumber} ]\` to \`[ ${toPosition} ]\` in your playlist.`, color);
            };
        } else return await invalidArgs("playlist", message, "Please provide a valid sub command.", client);
    }
}