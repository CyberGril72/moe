const Client = require("../../../index");
const { CommandInteraction, Permissions, MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const db = require("../../utils/schemas/playlists");
const { intReply, shuffleArray, moveArray } = require("../../handlers/functions");
const prettyMilliSeconds = require("pretty-ms");
const lodash = require("lodash");

module.exports = {
    data: {
        name: "playlist",
        description: "A simple playlist command.",
        options: [
            {
                name: "create",
                description: "To create a playlist.",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "name",
                        type: "STRING",
                        description: "The name of the playlist.",
                        required: true
                    }
                ]
            },

            {
                name: "shuffle",
                description: "To shuffle your playlist.",
                type: "SUB_COMMAND"
            },

            {
                name: "add",
                description: "To add track/song to your playlist.",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "input",
                        description: "The playlist input (name/url).",
                        type: "STRING",
                        required: true
                    }
                ]
            },
            {
                name: "movetrack",
                description: "To move a track from the playlist.",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "number",
                        description: "The track number in the playlist.",
                        type: "NUMBER",
                        required: true
                    },
                    {
                        name: "to",
                        description: "The to position in the playlist.",
                        type: "NUMBER",
                        required: true
                    }
                ]
            },
            {
                name: "delete",
                description: "To delete your playlist.",
                type: "SUB_COMMAND"
            },

            {
                name: "load",
                description: "To load the songs in your playlist.",
                type: "SUB_COMMAND_GROUP",
                options: [
                    {
                        name: "all",
                        description: "To load all the songs from your playlist.",
                        type: "SUB_COMMAND",
                    },

                    {
                        name: "track",
                        description: "To load a track from your playlist.",
                        type: "SUB_COMMAND",
                        options: [
                            {
                                name: "number",
                                description: "The track number.",
                                type: "NUMBER",
                                required: true
                            }
                        ]
                    }
                ]
            },

            {
                name: "addnowplaying",
                description: "To add the now playing track/song to your playlist.",
                type: "SUB_COMMAND"
            },

            {
                name: "addqueue",
                description: "To add the queue to your playlist.",
                type: "SUB_COMMAND"
            },

            {
                name: "list",
                description: "To see the list of tracks inside your playlist.",
                type: "SUB_COMMAND"
            },

            {
                name: "remove",
                description: "To remove tracks from your playlist.",
                type: "SUB_COMMAND_GROUP",
                options: [
                    {
                        name: "all",
                        description: "To remove all tracks/songs from your playlist.",
                        type: "SUB_COMMAND"
                    },

                    {
                        name: "track",
                        description: "To remove a track/song from your playlist.",
                        type: "SUB_COMMAND",
                        options: [
                            {
                                name: "number",
                                description: "The track number.",
                                type: "NUMBER",
                                required: true
                            }
                        ]
                    },

                    {
                        name: "dupes",
                        description: "To remove duplicated tracks from your playlist.",
                        type: "SUB_COMMAND"
                    }
                ]
            }
        ]
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
        let data = await db.findOne({ _id: interaction.user.id });

        if(interaction.options.getSubcommand() === "create") {
            if(data) return await intReply(interaction, `You've already created a custom playlist, delete it to create a new one.`, color);

            const playlistName = interaction.options.getString("name");

            if(!data) data = new db({
                _id: interaction.user.id,
                userName: interaction.user.username,
                playlistName: playlistName,
                createdOn: Math.round(Date.now()/1000)
            });

            await data.save();
            return await intReply(interaction, `Successfully created a playlist named ${playlistName}`, color);
        } else if(interaction.options.getSubcommand() === "movetrack") {
            if(!data) return await intReply(interaction, `You've not created a playlist for yourself to use this command.`, color);

            if(data.playlist.length <= 0) return await intReply(interaction, `Your playlist doesn't have any tracks left to shuffle.`, color);

            let num = interaction.options.getNumber("number");
            let toPosition = interaction.options.getNumber("to");
            if(!num) return await intReply(interaction, `Please provide a valid track number.`, color);
            if(!toPosition) return await intReply(interaction, `Please provide a to position.`, color);

            if(num <= 0 || num > data.playlist.length) return await intReply(interaction, `Please provide a valid track number from your playlist.`, color);

            if(toPosition <= 0 || toPosition > data.playlist.length) return await intReply(interaction, `Please provide a valid to position in your playlist.`, color);

            if(num === toPosition) return await intReply(interaction, `The track number that you've provided is already at this position.`, color);

            let array = moveArray(data.playlist, num - 1, toPosition - 1);
            data.playlist.splice(0);

            for (let i of array) data.playlist.push(i);
            await data.save();

            return await intReply(interaction, `Moved track number \`[ ${num} ]\` to \`[ ${toPosition} ]\` in your playlist.`, color);
        } else if(interaction.options.getSubcommand() === "shuffle") {
            if(!data) return await intReply(interaction, `You've not created a playlist for yourself to use this command.`, color);

            if(data.playlist.length <= 0) return await intReply(interaction, `Your playlist doesn't have any tracks left to shuffle.`, color);

            shuffleArray(data.playlist);
            await data.save();

            return await intReply(interaction, `Shuffled your playlist __${data.playlistName}__`, color);
        } else if(interaction.options.getSubcommand() === "add") {
            if(!data) return await intReply(interaction, `You've not created a playlist for yourself to use this command.`, color);

            if(data.playlist.length >= 100) return await intReply(interaction, `You've reached the maximum tracks limits in your playlist.`);
            const input = interaction.options.getString("input");

            let player = client.player.get(interaction.guildId);
            if(!player) player = client.player.create({
                guild: interaction.guildId,
                textChannel: interaction.channelId
            });

            let s = await player.search(input, interaction.user);
            if(s.loadType === "LOAD_FAILED") {
                if(player && !player.queue.current) player.destroy();
                return await intReply(interaction, `No results found for ${input}`, color);
            } else if(s.loadType === "NO_MATCHES") {
                if(player && !player.queue.current) player.destroy();
                return await intReply(interaction, `No results found for ${input}`, color);
            } else if(s.loadType === "PLAYLIST_LOADED") {
                for await (const track of s.tracks) {
                    data.playlist.push(track);
                };
                if(player && !player.queue.current) player.destroy();
                await data.save();
                return await intReply(interaction, `Added \`[ ${s.tracks.length} ]\` track(s) from __${s.playlist.name ? s.playlist.name : input}__ to your playlist.`, color);
            } else if(s.loadType === "TRACK_LOADED") {
                data.playlist.push(s.tracks[0]);
                await data.save();
                if(player && !player.queue.current) player.destroy();
                return await intReply(interaction, `Added [__${s.tracks[0].title}__](${s.tracks[0].uri}) to your playlist.`, color);
            } else if(s.loadType === "SEARCH_RESULT") {
                data.playlist.push(s.tracks[0]);
                await data.save();
                if(player && !player.queue.current) player.destroy();
                return await intReply(interaction, `Added [__${s.tracks[0].title}__](${s.tracks[0].uri}) to your playlist.`, color);
            } else {
                if(player && !player.queue.current) return player.destroy();
                return await intReply(interaction, `No results found for ${input}`, color);
            };
        } else if(interaction.options.getSubcommand() === "delete") {
            if(!data) return await intReply(interaction, `You've not created a playlist for yourself to use this command.`, color);

            await db.findOneAndDelete({ _id: interaction.user.id });
            return await intReply(interaction, `Successfully deleted your playlist.`, color);
        } else if(interaction.options.getSubcommand() === "addnowplaying") {
            if(!data) return await intReply(interaction, `You've not created a playlist for yourself to use this command.`, color);

            if(data.playlist.length >= 100) return await intReply(interaction, `You've reached the maximum tracks limits in your playlist.`);

            let player = client.player.get(interaction.guildId);
            if(!player) return await intReply(interaction, `Nothing is playing right now.`, color);
            if(!player.queue) return await intReply(interaction, `Nothing is playing right now.`, color);
            if(!player.queue.current) return await intReply(interaction, `Nothing is playing right now.`, color);

            data.playlist.push(player.queue.current);
            await data.save();

            return await intReply(interaction, `Added [__${player.queue.current.title}__](${player.queue.current.uri}) to your playlist.`, color);
        } else if(interaction.options.getSubcommand() === "addqueue") {
            if(!data) return await intReply(interaction, `You've not created a playlist for yourself to use this command.`, color);

            if(data.playlist.length >= 100) return await intReply(interaction, `You've reached the maximum tracks limits in your playlist.`);

            let player = client.player.get(interaction.guildId);
            if(!player) return await intReply(interaction, `Nothing is playing right now.`, color);
            if(!player.queue) return await intReply(interaction, `Nothing is playing right now.`, color);
            if(!player.queue.current) return await intReply(interaction, `Nothing is playing right now.`, color);

            for (const track of player.queue) {
                data.playlist.push(track);
            };

            await data.save();
            return await intReply(interaction, `Added \`[ ${player.queue.size} ]\` tracks from the queue to your playlist.`, color);
        } else if(interaction.options.getSubcommand() === "list") {
            if(!data) return await intReply(interaction, `You've not created a playlist for yourself to use this command.`, color);

            if(data.playlist.length <= 0 || data.playlist === null) return await intReply(interaction, `No songs/tracks found in your playlist named ${data.playlistName}`, color);

            let map = data.playlist.map((x, i) => `> \`[ ${++i} ]\` ~ [**__${x.title}__**](${x.uri}) ${x.duration ? `~ \`[ ${prettyMilliSeconds(Number(x.duration))} ]\`` : ""}`);

            let pages = lodash.chunk(map, 8).map((x) => x.join("\n"));
            let page = 0;

            let embed1 = new MessageEmbed().setColor(color).setDescription(`**Playlist name:** ${data.playlistName}\n**Total tracks:** \`[ ${data.playlist.length} ]\`\n\n${pages[page]}`).setFooter({text: `Requested by ${interaction.user.username}`,iconURL: interaction.user.displayAvatarURL({ dynamic: true })}).setTitle(`${interaction.user.username}'s Playlist`).setTimestamp();

            if(pages.length <= 1) {
                return await interaction.editReply({ embeds: [embed1] }).catch(() => {});
            } else {
                embed1.setFooter({text: `Page ${page + 1} of ${pages.length}`,iconURL: interaction.user.displayAvatarURL({ dynamic: true })});

                let nextbut = new MessageButton().setCustomId(`playlist_list_cmd_next_but`).setEmoji("➡️").setStyle("SECONDARY");

                let stopbut = new MessageButton().setCustomId(`playlist_list_cmd_stop_but`).setEmoji("⏹️").setStyle("SECONDARY");

                let previousbut = new MessageButton().setCustomId(`playlist_list_cmd_previous_but`).setEmoji("⬅️").setStyle("SECONDARY");

                const row1 = new MessageActionRow().addComponents(previousbut, stopbut, nextbut);

                await interaction.editReply({ embeds: [embed1], components: [row1] }).catch(() => {});

                const collector = interaction.channel.createMessageComponentCollector({
                    filter: (b) => {
                        if(b.user.id === interaction.user.id) return true;
                        else {
                            b.deferUpdate().catch(() => {});
                            return false;
                        };
                    },
                    time: 5*60000,
                    idle: 5*60000/2
                });

                collector.on("end", async () => {
                    await interaction.editReply({
                        components: [new MessageActionRow().addComponents(previousbut.setDisabled(true), stopbut.setDisabled(true), nextbut.setDisabled(true))]
                    }).catch(() => {});
                });

                collector.on("collect", async (button) => {
                    if(button.customId === previousbut.customId) {
                        await button.deferUpdate().catch(() => {});
                        page = page - 1 < 0 ? pages.length - 1 : --page;

                        return await interaction.editReply({
                            embeds: [embed1.setFooter({text: `Page ${page + 1} of ${pages.length}`,iconURL: interaction.user.displayAvatarURL({ dynamic: true })}).setDescription(`**Playlist name:** ${data.playlistName}\n**Total tracks:** \`[ ${data.playlist.length} ]\`\n\n${pages[page]}`)]
                        }).catch(() => {});
                    } else if(button.customId === stopbut.customId) {
                        await button.deferUpdate().catch(() => {});
                        return collector.stop();
                    } else if(button.customId === nextbut.customId) {
                        await button.deferUpdate().catch(() => {});
                        page = page + 1 < pages.length ? ++page : 0;

                        return await interaction.editReply({
                            embeds: [embed1.setFooter({text: `Page ${page + 1} of ${pages.length}`,iconURL: interaction.user.displayAvatarURL({ dynamic: true })}).setDescription(`**Playlist name:** ${data.playlistName}\n**Total tracks:** \`[ ${data.playlist.length} ]\`\n\n${pages[page]}`)]
                        }).catch(() => {});
                    } else return; 
                });
            };
        } else if(interaction.options.getSubcommandGroup() === "remove") {
            if(interaction.options.getSubcommand() === "all") {
                if(!data) return await intReply(interaction, `You've not created a playlist for yourself to use this command.`, color);

                if(data.playlist.length <= 0 || data.playlist === null) return await intReply(interaction, `No songs/tracks found in your playlist named ${data.playlistName}`, color);

                await intReply(interaction, `Removed \`[ ${data.playlist.length} ]\` tracks from your playlist.`, color);

                data.playlist.splice(0);
                await data.save();
            } else if(interaction.options.getSubcommand() === "track") {
                if(!data) return await intReply(interaction, `You've not created a playlist for yourself to use this command.`, color);

                if(data.playlist.length <= 0 || data.playlist === null) return await intReply(interaction, `No songs/tracks found in your playlist named ${data.playlistName}`, color);

                const trackNumber = interaction.options.getNumber("number");
                if(!trackNumber) return await intReply(interaction, `You've not provided any track number to remove.`, color);

                if(trackNumber <= 0) return await intReply(interaction, `You've provided an invalid track number, please check the playlist again.`, color);

                if(trackNumber > data.playlist.length) return await intReply(interaction, `You've provided an invalid track number, please check the playlist again.`, color);

                const removetrackNum = trackNumber - 1;

                const track = data.playlist[removetrackNum];
                if(!track) return await intReply(interaction, `You've provided an invalid track number, please check the playlist again.`, color);
                await intReply(interaction, `Removed [__${track.title}__](${track.uri}) from your playlist.`, color);
                
                data.playlist.splice(removetrackNum, 1);
                await data.save();
            } else if(interaction.options.getSubcommand() === "dupes") {
                if(!data) return await intReply(interaction, `You've not created a playlist for yourself to use this command.`, color);

                if(data.playlist.length <= 0 || data.playlist === null) return await intReply(interaction, `No songs/tracks found in your playlist named ${data.playlistName}`, color);

                let count = 0;
                let dumpedtracks = [];

                for (const track of data.playlist) {
                    if(dumpedtracks.length <= 0) dumpedtracks.push(track);
                    else {
                        let idklol = dumpedtracks.find((x) => x.title === track.title || x.uri === track.uri);
                        if(!idklol) dumpedtracks.push(track);
                        else ++count;
                    };
                };

                if(count <= 0) return await intReply(interaction, `No duplicated tracks found on your playlist.`, color);

                data.playlist.splice(0);
                for (let e of dumpedtracks) data.playlist.push(e);
                await data.save();

                return await intReply(interaction, `Removed \`[ ${count} ]\` duplicated tracks from your playlist.`, color);
            } else return await intReply(interaction, `You've choosen an invalid sub command.`, color);
        } else if(interaction.options.getSubcommandGroup() === "load") {
            if(interaction.options.getSubcommand() === "all") {
                if(!data) return await intReply(interaction, `You've not created a playlist for yourself to use this command.`, color);

                if(data.playlist.length <= 0 || data.playlist === null) return await intReply(interaction, `No songs/tracks found in your playlist named ${data.playlistName}`, color);

                if(!interaction.member.voice.channel) return await interaction.editReply({
                    embeds: [new MessageEmbed().setColor(color).setDescription(`**You are not connected to a voice channel to use this command.**`)]
                }).catch(() => {});
            
                if(!interaction.member.voice.channel.permissionsFor(client.user).has([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK])) return await interaction.editReply({
                    embeds: [new MessageEmbed().setColor(color).setDescription(`**I don't have enough permissions in ${interaction.member.voice.channel} to execute this command.**`)]
                }).catch(() => {});

                let player = client.player.get(interaction.guildId);
                if(!player) player = client.player.create({
                    guild: interaction.guildId,
                    textChannel: interaction.channelId,
                    voiceChannel: interaction.member.voice.channelId,
                    selfDeafen: true,
                    volume: 80
                });

                if(player && player.state !== "CONNECTED") player.connect();
                await intReply(interaction, `Adding \`[ ${data.playlist.length} ]\` tracks from your playlist __${data.playlistName}__`, color);

                for await (const track of data.playlist) {
                    if(!player) return await intReply(interaction, `Process canceled due to player not found.`, color);
                    let s = await player.search(track.uri ? track.uri : track.title, interaction.user);
                    if(s.loadType === "TRACK_LOADED") {
                        if(!player) return await intReply(interaction, `Process canceled due to player not found.`, color);
                        if(player && player.state !== "CONNECTED") player.connect();
                        if(player) player.queue.add(s.tracks[0]);
                        if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) player.play();
                    } else if(s.loadType === "SEARCH_RESULT") {
                        if(!player) return await intReply(interaction, `Process canceled due to player not found.`, color);
                        if(player && player.state !== "CONNECTED") player.connect();
                        if(player) player.queue.add(s.tracks[0]);
                        if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) player.play();
                    };
                };

                return await intReply(interaction, `Added \`[ ${data.playlist.length} ]\` tracks from your playlist __${data.playlistName}__`, color);
            } else if(interaction.options.getSubcommand() === "track") {
                if(!data) return await intReply(interaction, `You've not created a playlist for yourself to use this command.`, color);

                if(data.playlist.length <= 0 || data.playlist === null) return await intReply(interaction, `Your playlist doesn't have any tracks left to load.`, color);

                let trackNumber = interaction.options.getNumber("number");
                if(trackNumber > data.playlist.length) return await intReply(interaction, `You've provided an invalid track number from your playlist.`, color);

                if(trackNumber <= 0) return await intReply(interaction, `You've provided an invalid track number from your playlist.`, color);

                let thetrackNum = Number(trackNumber) - 1;

                let track = data.playlist[thetrackNum];
                if(!track) return await intReply(interaction, `You've provided an invalid track number from your playlist.`, color);

                if(!interaction.member.voice.channel) return await interaction.editReply({
                    embeds: [new MessageEmbed().setColor(color).setDescription(`**You are not connected to a voice channel to use this command.**`)]
                }).catch(() => {});
            
                if(!interaction.member.voice.channel.permissionsFor(client.user).has([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK])) return await interaction.editReply({
                    embeds: [new MessageEmbed().setColor(color).setDescription(`I don't have enough permissions in ${interaction.member.voice.channel} to execute this command.`)]
                }).catch(() => {});

                let player = client.player.get(interaction.guildId);
                if(!player) player = client.player.create({
                    guild: interaction.guildId,
                    textChannel: interaction.channelId,
                    voiceChannel: interaction.member.voice.channelId,
                    selfDeafen: true,
                    volume: 80
                });

                if(player && player.state !== "CONNECTED") player.connect();
                let s = await player.search(track.uri ? track.uri : track.title, interaction.user);
                if(s.loadType === "SEARCH_RESULT") {
                    if(!player) return await intReply(interaction, `Process canceled due to player not found.`, color);
                    if(player && player.state !== "CONNECTED") player.connect();
                    if(player) player.queue.add(s.tracks[0]);
                    if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) player.play();

                    return await intReply(interaction, `Added [__${s.tracks[0].title}__](${s.tracks[0].uri}) to the queue.`, color);
                } else if(s.loadType === "TRACK_LOADED") {
                    if(!player) return await intReply(interaction, `Process canceled due to player not found.`, color);
                    if(player && player.state !== "CONNECTED") player.connect();
                    if(player) player.queue.add(s.tracks[0]);
                    if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) player.play();

                    return await intReply(interaction, `Added [__${s.tracks[0].title}__](${s.tracks[0].uri}) to the queue.`, color);
                } else {
                    if(player && !player.queue.current) player.destroy();
                    return await intReply(interaction, `No results found for __${track.title}__`, color);
                }
            };
        } else return await intReply(interaction, `You've choosen an invalid sub command.`, color);
    }
}