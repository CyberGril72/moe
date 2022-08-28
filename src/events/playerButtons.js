const Client = require("../../index");
const { ButtonInteraction, Permissions, MessageEmbed } = require("discord.js");
const { intCheck, buttonReply, moveArray } = require("../handlers/functions");
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    name: "playerButtons",

    /**
     * 
     * @param {Client} client 
     * @param {ButtonInteraction} interaction 
     * @param {*} data 
     * @param {String} color
     */

    execute: async (client, interaction, data, color) => {
        if(!interaction.replied) await interaction.deferReply().catch(() => {});
        if(!interaction.member.voice.channel) return await buttonReply(interaction, `You are not connected to a voice channel to use this button.`, color);
        if(interaction.guild.me.voice.channel && interaction.guild.me.voice.channelId !== interaction.member.voice.channelId) return await buttonReply(interaction, `You are not connected to ${interaction.guild.me.voice.channel} to use this buttons.`, color);

        let check = await intCheck(interaction, Permissions.FLAGS.MANAGE_CHANNELS);
        if(!check) return await buttonReply(interaction, `You don't have the dj role or permissions to use this buttons.`, color);

        const player = client.player.get(interaction.guildId);

        if(player && interaction.customId === `stop_but_${interaction.guildId}`) {
            player.destroy();
            return await buttonReply(interaction, `Player is now stopped/destroyed.`, color);
        };

        if(!player) return await buttonReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue) return await buttonReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue.current) return await buttonReply(interaction, `Nothing is playing right now.`, color);

        if(player && player.state !== "CONNECTED") {
            player.destroy();
            return await buttonReply(interaction, `Nothing is playing right now.`, color);
        };

        const { title, uri, duration, requester } = player.queue.current;

        let message;
        try {

            message = await interaction.channel.messages.fetch(data.message, { cache: true });

        } catch (e) {};

        let icon = player.queue.current.identifier ? `https://img.youtube.com/vi/${player.queue.current.identifier}/maxresdefault.jpg` : client.config.links.image;

        let queueStats = new MessageEmbed();

        let nowplaying = new MessageEmbed().setColor(color).setTitle(`${title} ~ [${prettyMilliseconds(duration)}]`).setImage(icon).setFooter({text: `Requested by ${requester.username}`, iconURL: requester.displayAvatarURL({ dynamic: true })});

        if(interaction.customId === `pause_but_${interaction.guildId}`) {
            if(player.paused) {
                player.pause(false);

                await buttonReply(interaction, `[${title}](${uri}) is now unpaused/resumed.`, color);

                queueStats.setColor(color).setTitle("Queue Stats").addFields([
                    {
                        name: "Queued Track(s)",
                        value: `\`[ ${player.queue.size ? player.queue.size : `0`} ]\``,
                        inline: true
                    },
                    {
                        name: "Track Loop",
                        value: `${player.trackRepeat ? "Enabled" : "Disabled"}`,
                        inline: true
                    },
                    {
                        name: "Queue Loop",
                        value: `${player.queueRepeat ? "Enabled" : "Disabled"}`,
                        inline: true
                    },
                    {
                        name: "Volume",
                        value: `\`[ ${player.volume}% ]\``,
                        inline: true
                    },
                    {
                        name: "Autoplay",
                        value: `${player.get("autoplay") ? "Enabled" : "Disabled"}`,
                        inline: true
                    },
                    {
                        name: "Duration",
                        value: `\`[ ${prettyMilliseconds(duration)} ]\``,
                        inline: true
                    }
                ]);

                if(message) await message.edit({
                    embeds: [queueStats, nowplaying]
                }).catch(() => {});
            } else {
                player.pause(true);

                await buttonReply(interaction, `[${title}](${uri}) is now paused.`, color);

                queueStats.setColor(color).setTitle("Queue Stats").addFields([
                    {
                        name: "Queued Track(s)",
                        value: `\`[ ${player.queue.size ? player.queue.size : `0`} ]\``,
                        inline: true
                    },
                    {
                        name: "Track Loop",
                        value: `${player.trackRepeat ? "Enabled" : "Disabled"}`,
                        inline: true
                    },
                    {
                        name: "Pause",
                        value: `${player.paused ? "Enabled" : "Disabled"}`
                    },
                    {
                        name: "Volume",
                        value: `\`[ ${player.volume}% ]\``,
                        inline: true
                    },
                    {
                        name: "Autoplay",
                        value: `${player.get("autoplay") ? "Enabled" : "Disabled"}`,
                        inline: true
                    },
                    {
                        name: "Duration",
                        value: `\`[ ${prettyMilliseconds(duration)} ]\``,
                        inline: true
                    }
                ]);

                if(message) await message.edit({
                    embeds: [queueStats, nowplaying]
                }).catch(() => {});
            };
        } else if(interaction.customId === `previous_but_${interaction.guildId}`) {
            if(!player) return await buttonReply(interaction, `Process cancled due to player not found.`, color);
            if(!player.queue.previous) return await buttonReply(interaction ,`No previously played song found.`, color);

            player.queue.add(player.queue.previous);
            if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

            if(player.queue.size === 1) {
                player.stop();
            } else {
                const move = moveArray(player.queue, player.queue.length - 1, 0);
                player.queue.clear();
                player.queue.add(move);

                if(player.queue.current.title !== player.queue.previous.title || player.queue.current.uri !== player.queue.previous.uri) player.stop();
            };

            return await buttonReply(interaction, `Now playing [${player.queue.previous.title}](${player.queue.previous.uri})`, color);
        } else if(interaction.customId === `stop_but_${interaction.guildId}`) {
            player.destroy();
            return await buttonReply(interaction, `Player has been stopped/destroyed.`, color);
        } else if(interaction.customId === `loopmodesbut_but_${interaction.guildId}`) {
            if(!player.queue.size) {
                if(player.trackRepeat) {
                    player.setTrackRepeat(false);
                    await buttonReply(interaction, `Player track looping/repeating is now disabled.`, color);

                    queueStats.setColor(color).setTitle("Queue Stats").addFields([
                        {
                            name: "Queued Track(s)",
                            value: `\`[ ${player.queue.size ? player.queue.size : `0`} ]\``,
                            inline: true
                        },
                        {
                            name: "Track Loop",
                            value: `${player.trackRepeat ? "Enabled" : "Disabled"}`,
                            inline: true
                        },
                        {
                            name: "Queue Loop",
                            value: `${player.queueRepeat ? "Enabled" : "Disabled"}`,
                            inline: true
                        },
                        {
                            name: "Volume",
                            value: `\`[ ${player.volume}% ]\``,
                            inline: true
                        },
                        {
                            name: "Autoplay",
                            value: `${player.get("autoplay") ? "Enabled" : "Disabled"}`,
                            inline: true
                        },
                        {
                            name: "Duration",
                            value: `\`[ ${prettyMilliseconds(duration)} ]\``,
                            inline: true
                        }
                    ]);

                    if(message) await message.edit({
                        embeds: [queueStats, nowplaying]
                    }).catch(() => {});
                } else {
                    player.setTrackRepeat(true)
                    await buttonReply(interaction, `Player track looping/repeating is now enabled.`, color);

                    queueStats.setColor(color).setTitle("Queue Stats").addFields([
                        {
                            name: "Queued Track(s)",
                            value: `\`[ ${player.queue.size ? player.queue.size : `0`} ]\``,
                            inline: true
                        },
                        {
                            name: "Track Loop",
                            value: `${player.trackRepeat ? "Enabled" : "Disabled"}`,
                            inline: true
                        },
                        {
                            name: "Queue Loop",
                            value: `${player.queueRepeat ? "Enabled" : "Disabled"}`,
                            inline: true
                        },
                        {
                            name: "Volume",
                            value: `\`[ ${player.volume}% ]\``,
                            inline: true
                        },
                        {
                            name: "Autoplay",
                            value: `${player.get("autoplay") ? "Enabled" : "Disabled"}`,
                            inline: true
                        },
                        {
                            name: "Duration",
                            value: `\`[ ${prettyMilliseconds(duration)} ]\``,
                            inline: true
                        }
                    ]);

                    if(message) await message.edit({
                        embeds: [queueStats, nowplaying]
                    }).catch(() => {});
                };
            } else {
                const choices = ["track", "queue", "shuffle"];
                    let random = choices[Math.floor(Math.random() * choices.length)];

                    if(random === choices[0]) {
                        if(player.trackRepeat) {
                            player.setTrackRepeat(false);
                            await buttonReply(interaction, `Player track looping/repeating is now disabled.`, color);

                            queueStats.setColor(color).setTitle("Queue Stats").addFields([
                                {
                                    name: "Queued Track(s)",
                                    value: `\`[ ${player.queue.size ? player.queue.size : `0`} ]\``,
                                    inline: true
                                },
                                {
                                    name: "Track Loop",
                                    value: `${player.trackRepeat ? "Enabled" : "Disabled"}`,
                                    inline: true
                                },
                                {
                                    name: "Queue Loop",
                                    value: `${player.queueRepeat ? "Enabled" : "Disabled"}`,
                                    inline: true
                                },
                                {
                                    name: "Volume",
                                    value: `\`[ ${player.volume}% ]\``,
                                    inline: true
                                },
                                {
                                    name: "Autoplay",
                                    value: `${player.get("autoplay") ? "Enabled" : "Disabled"}`,
                                    inline: true
                                },
                                {
                                    name: "Duration",
                                    value: `\`[ ${prettyMilliseconds(duration)} ]\``,
                                    inline: true
                                }
                            ]);

                            if(message) await message.edit({
                                embeds: [queueStats, nowplaying]
                            }).catch(() => {});
                        } else {
                            player.setTrackRepeat(true)
                            await buttonReply(interaction, `Player track looping/repeating is now enabled.`, color);

                            queueStats.setColor(color).setTitle("Queue Stats").addFields([
                                {
                                    name: "Queued Track(s)",
                                    value: `\`[ ${player.queue.size ? player.queue.size : `0`} ]\``,
                                    inline: true
                                },
                                {
                                    name: "Track Loop",
                                    value: `${player.trackRepeat ? "Enabled" : "Disabled"}`,
                                    inline: true
                                },
                                {
                                    name: "Queue Loop",
                                    value: `${player.queueRepeat ? "Enabled" : "Disabled"}`,
                                    inline: true
                                },
                                {
                                    name: "Volume",
                                    value: `\`[ ${player.volume}% ]\``,
                                    inline: true
                                },
                                {
                                    name: "Autoplay",
                                    value: `${player.get("autoplay") ? "Enabled" : "Disabled"}`,
                                    inline: true
                                },
                                {
                                    name: "Duration",
                                    value: `\`[ ${prettyMilliseconds(duration)} ]\``,
                                    inline: true
                                }
                            ]);

                            if(message) await message.edit({
                                embeds: [queueStats, nowplaying]
                            }).catch(() => {});
                        };
                    } else if(random === choices[1]) {
                        if(player.trackRepeat) {
                            player.setQueueRepeat(false);
                            await buttonReply(interaction, `Player queue looping/repeating is now disabled.`, color);

                            queueStats.setColor(color).setTitle("Queue Stats").addFields([
                                {
                                    name: "Queued Track(s)",
                                    value: `\`[ ${player.queue.size ? player.queue.size : `0`} ]\``,
                                    inline: true
                                },
                                {
                                    name: "Track Loop",
                                    value: `${player.trackRepeat ? "Enabled" : "Disabled"}`,
                                    inline: true
                                },
                                {
                                    name: "Queue Loop",
                                    value: `${player.queueRepeat ? "Enabled" : "Disabled"}`,
                                    inline: true
                                },
                                {
                                    name: "Volume",
                                    value: `\`[ ${player.volume}% ]\``,
                                    inline: true
                                },
                                {
                                    name: "Autoplay",
                                    value: `${player.get("autoplay") ? "Enabled" : "Disabled"}`,
                                    inline: true
                                },
                                {
                                    name: "Duration",
                                    value: `\`[ ${prettyMilliseconds(duration)} ]\``,
                                    inline: true
                                }
                            ]);

                            if(message) await message.edit({
                                embeds: [queueStats, nowplaying]
                            }).catch(() => {});
                        } else {
                            player.setQueueRepeat(true)
                            await buttonReply(interaction, `Player queue looping/repeating is now enabled.`, color);

                            queueStats.setColor(color).setTitle("Queue Stats").addFields([
                                {
                                    name: "Queued Track(s)",
                                    value: `\`[ ${player.queue.size ? player.queue.size : `0`} ]\``,
                                    inline: true
                                },
                                {
                                    name: "Track Loop",
                                    value: `${player.trackRepeat ? "Enabled" : "Disabled"}`,
                                    inline: true
                                },
                                {
                                    name: "Queue Loop",
                                    value: `${player.queueRepeat ? "Enabled" : "Disabled"}`,
                                    inline: true
                                },
                                {
                                    name: "Volume",
                                    value: `\`[ ${player.volume}% ]\``,
                                    inline: true
                                },
                                {
                                    name: "Autoplay",
                                    value: `${player.get("autoplay") ? "Enabled" : "Disabled"}`,
                                    inline: true
                                },
                                {
                                    name: "Duration",
                                    value: `\`[ ${prettyMilliseconds(duration)} ]\``,
                                    inline: true
                                }
                            ]);

                            if(message) await message.edit({
                                embeds: [queueStats, nowplaying]
                            }).catch(() => {});
                        };
                    } else if(random === choices[2]) {
                        player.queue.shuffle();
                        await buttonReply(interaction, `Player queue is now shuffled.`, color);

                        queueStats.setColor(color).setTitle("Queue Stats").addFields([
                            {
                                name: "Queued Track(s)",
                                value: `\`[ ${player.queue.size ? player.queue.size : `0`} ]\``,
                                inline: true
                            },
                            {
                                name: "Track Loop",
                                value: `${player.trackRepeat ? "Enabled" : "Disabled"}`,
                                inline: true
                            },
                            {
                                name: "Queue Loop",
                                value: `${player.queueRepeat ? "Enabled" : "Disabled"}`,
                                inline: true
                            },
                            {
                                name: "Volume",
                                value: `\`[ ${player.volume}% ]\``,
                                inline: true
                            },
                            {
                                name: "Autoplay",
                                value: `${player.get("autoplay") ? "Enabled" : "Disabled"}`,
                                inline: true
                            },
                            {
                                name: "Duration",
                                value: `\`[ ${prettyMilliseconds(duration)} ]\``,
                                inline: true
                            }
                        ]);

                        if(message) await message.edit({
                            embeds: [queueStats, nowplaying]
                        }).catch(() => {});
                    };
            };
        } else if(interaction.customId === `forward_but_${interaction.guildId}`) {
            let forwardposition = Number(player.position) + 10000;
            if(forwardposition >= duration) return await buttonReply(interaction, `Cannot forward any further more.`, color);

            if(player.paused) return await buttonReply(interaction, `Cannot forward because the player is currently paused.`, color);

            if(!player.queue.current.isSeekable) return await buttonReply(interaction, `Unable to forward this track.`, color);

            player.seek(forwardposition);
            await buttonReply(interaction, `Forwarded \`[ 10s ]\` to \`[ ${prettyMilliseconds(Number(player.position))} / ${prettyMilliseconds(Number(duration))} ]\``, color);

            queueStats.setColor(color).setTitle("Queue Stats").addFields([
                {
                    name: "Queued Track(s)",
                    value: `\`[ ${player.queue.size ? player.queue.size : `0`} ]\``,
                    inline: true
                },
                {
                    name: "Track Loop",
                    value: `${player.trackRepeat ? "Enabled" : "Disabled"}`,
                    inline: true
                },
                {
                    name: "Queue Loop",
                    value: `${player.queueRepeat ? "Enabled" : "Disabled"}`,
                    inline: true
                },
                {
                    name: "Volume",
                    value: `\`[ ${player.volume}% ]\``,
                    inline: true
                },
                {
                    name: "Autoplay",
                    value: `${player.get("autoplay") ? "Enabled" : "Disabled"}`,
                    inline: true
                },
                {
                    name: "Duration",
                    value: `\`[ ${prettyMilliseconds(duration)} ]\``,
                    inline: true
                }
            ]);

            if(message) await message.edit({
                embeds: [queueStats, nowplaying]
            }).catch(() => {});
        } else if(interaction.customId === `skipbut_but_${interaction.guildId}`) {
            if(!player.queue.size) return await buttonReply(interaction, `No more songs left in the queue to skip.`, color);

            player.stop();
            return await buttonReply(interaction, `Skipped [${title}](${uri})`, color);
        } else if(interaction.customId === `autoplay_but_${interaction.guildId}`) {
            const autoplay = player.get("autoplay");
            if(!autoplay) {
                player.set("autoplay", true);
                await buttonReply(interaction, `Autoplay is now enabled.`, color);

                queueStats.setColor(color).setTitle("Queue Stats").addFields([
                    {
                        name: "Queued Track(s)",
                        value: `\`[ ${player.queue.size ? player.queue.size : `0`} ]\``,
                        inline: true
                    },
                    {
                        name: "Track Loop",
                        value: `${player.trackRepeat ? "Enabled" : "Disabled"}`,
                        inline: true
                    },
                    {
                        name: "Queue Loop",
                        value: `${player.queueRepeat ? "Enabled" : "Disabled"}`,
                        inline: true
                    },
                    {
                        name: "Volume",
                        value: `\`[ ${player.volume}% ]\``,
                        inline: true
                    },
                    {
                        name: "Autoplay",
                        value: `${player.get("autoplay") ? "Enabled" : "Disabled"}`,
                        inline: true
                    },
                    {
                        name: "Duration",
                        value: `\`[ ${prettyMilliseconds(duration)} ]\``,
                        inline: true
                    }
                ]);

                if(message) await message.edit({
                    embeds: [queueStats, nowplaying]
                }).catch(() => {});
            } else {
                player.set("autoplay", false);
                await buttonReply(interaction, `Autoplay is now disabled.`, color);

                queueStats.setColor(color).setTitle("Queue Stats").addFields([
                    {
                        name: "Queued Track(s)",
                        value: `\`[ ${player.queue.size ? player.queue.size : `0`} ]\``,
                        inline: true
                    },
                    {
                        name: "Track Loop",
                        value: `${player.trackRepeat ? "Enabled" : "Disabled"}`,
                        inline: true
                    },
                    {
                        name: "Queue Loop",
                        value: `${player.queueRepeat ? "Enabled" : "Disabled"}`,
                        inline: true
                    },
                    {
                        name: "Volume",
                        value: `\`[ ${player.volume}% ]\``,
                        inline: true
                    },
                    {
                        name: "Autoplay",
                        value: `${player.get("autoplay") ? "Enabled" : "Disabled"}`,
                        inline: true
                    },
                    {
                        name: "Duration",
                        value: `\`[ ${prettyMilliseconds(duration)} ]\``,
                        inline: true
                    }
                ]);

                if(message) await message.edit({
                    embeds: [queueStats, nowplaying]
                }).catch(() => {});
            };
        } else if(interaction.customId === `rewindbut_but_${interaction.guildId}`) {
            let rewindposition = Number(player.position) - 10000;
            if(rewindposition < 0) return await buttonReply(interaction, `Cannot rewind any further more.`, color);

            if(player.paused) return await buttonReply(interaction, `Cannot forward because the player is currently paused.`, color);

            if(!player.queue.current.isSeekable) return await buttonReply(interaction, `Unable to rewind this track.`, color);

            player.seek(rewindposition);
            await buttonReply(interaction, `Rewinded \`[ 10s ]\` to \`[ ${prettyMilliseconds(Number(player.position))} / ${prettyMilliseconds(Number(duration))} ]\``, color);

            queueStats.setColor(color).setTitle("Queue Stats").addFields([
                {
                    name: "Queued Track(s)",
                    value: `\`[ ${player.queue.size ? player.queue.size : `0`} ]\``,
                    inline: true
                },
                {
                    name: "Track Loop",
                    value: `${player.trackRepeat ? "Enabled" : "Disabled"}`,
                    inline: true
                },
                {
                    name: "Queue Loop",
                    value: `${player.queueRepeat ? "Enabled" : "Disabled"}`,
                    inline: true
                },
                {
                    name: "Volume",
                    value: `\`[ ${player.volume}% ]\``,
                    inline: true
                },
                {
                    name: "Autoplay",
                    value: `${player.get("autoplay") ? "Enabled" : "Disabled"}`,
                    inline: true
                },
                {
                    name: "Duration",
                    value: `\`[ ${prettyMilliseconds(duration)} ]\``,
                    inline: true
                }
            ]);

            if(message) await message.edit({
                embeds: [queueStats, nowplaying]
            }).catch(() => {});

        } else if(interaction.customId === `lowvolume_but_${interaction.guildId}`) {
            let amount = Number(player.volume) - 10;
            if(amount <= 10) return await buttonReply(interaction, `Cannot lower the player volume further more.`, color);

            player.setVolume(amount);
            await buttonReply(interaction, `Player volume set to \`[ ${player.volume}% ]\``, color);

            queueStats.setColor(color).setTitle("Queue Stats").addFields([
                {
                    name: "Queued Track(s)",
                    value: `\`[ ${player.queue.size ? player.queue.size : `0`} ]\``,
                    inline: true
                },
                {
                    name: "Track Loop",
                    value: `${player.trackRepeat ? "Enabled" : "Disabled"}`,
                    inline: true
                },
                {
                    name: "Queue Loop",
                    value: `${player.queueRepeat ? "Enabled" : "Disabled"}`,
                    inline: true
                },
                {
                    name: "Volume",
                    value: `\`[ ${player.volume}% ]\``,
                    inline: true
                },
                {
                    name: "Autoplay",
                    value: `${player.get("autoplay") ? "Enabled" : "Disabled"}`,
                    inline: true
                },
                {
                    name: "Duration",
                    value: `\`[ ${prettyMilliseconds(duration)} ]\``,
                    inline: true
                }
            ]);

            if(message) await message.edit({
                embeds: [queueStats, nowplaying]
            }).catch(() => {});

        } else if(interaction.customId === `highvolume_but_${interaction.guildId}`) {
            let amount = Number(player.volume) + 10;
            if(amount >= 200) return await buttonReply(interaction, `Cannot higher the player volume further more.`, color);

            player.setVolume(amount);
            await buttonReply(interaction, `Player volume set to \`[ ${player.volume}% ]\``, color);

            queueStats.setColor(color).setTitle("Queue Stats").addFields([
                {
                    name: "Queued Track(s)",
                    value: `\`[ ${player.queue.size ? player.queue.size : `0`} ]\``,
                    inline: true
                },
                {
                    name: "Track Loop",
                    value: `${player.trackRepeat ? "Enabled" : "Disabled"}`,
                    inline: true
                },
                {
                    name: "Queue Loop",
                    value: `${player.queueRepeat ? "Enabled" : "Disabled"}`,
                    inline: true
                },
                {
                    name: "Volume",
                    value: `\`[ ${player.volume}% ]\``,
                    inline: true
                },
                {
                    name: "Autoplay",
                    value: `${player.get("autoplay") ? "Enabled" : "Disabled"}`,
                    inline: true
                },
                {
                    name: "Duration",
                    value: `\`[ ${prettyMilliseconds(duration)} ]\``,
                    inline: true
                }
            ]);

            if(message) await message.edit({
            embeds: [queueStats, nowplaying]
        }).catch(() => {});
        } else {
            queueStats.setColor(color).setTitle("Queue Stats").addFields([
                {
                    name: "Queued Track(s)",
                    value: `\`[ ${player.queue.size ? player.queue.size : `0`} ]\``,
                    inline: true
                },
                {
                    name: "Track Loop",
                    value: `${player.trackRepeat ? "Enabled" : "Disabled"}`,
                    inline: true
                },
                {
                    name: "Queue Loop",
                    value: `${player.queueRepeat ? "Enabled" : "Disabled"}`,
                    inline: true
                },
                {
                    name: "Volume",
                    value: `\`[ ${player.volume}% ]\``,
                    inline: true
                },
                {
                    name: "Autoplay",
                    value: `${player.get("autoplay") ? "Enabled" : "Disabled"}`,
                    inline: true
                },
                {
                    name: "Duration",
                    value: `\`[ ${prettyMilliseconds(duration)} ]\``,
                    inline: true
                }
            ]);

            if(message) await message.edit({
                embeds: [queueStats, nowplaying]
            }).catch(() => {});

            return await buttonReply(interaction, `You've choosen an invalid button!`, color);
        };
    }
}