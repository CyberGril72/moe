const { Message, MessageEmbed, TextChannel, MessageActionRow, MessageButton, CommandInteraction, Permissions, ButtonInteraction, SelectMenuInteraction, User } = require("discord.js");
const { Player } = require("erela.js");
const prettyMilliseconds = require("pretty-ms");
const prefixSchema = require("../utils/schemas/prefix");
const lodash = require("lodash");
const setupSchema = require("../utils/schemas/setup");
const djroleSchema = require("../utils/schemas/dj");
const Client = require("../../index");
const { songs } = require("../utils/autoplay.json");

/**
 * 
 * @param {String} id 
 * @param {Client} client
 * @returns {String}
 */

async function getPrefix(id, client) {
    let prefix = client.config.prefix;
    let data = await prefixSchema.findOne({ _id: id });
    if (data && data.prefix) prefix = data.prefix;

    return prefix;
};

/**
 * 
 * @param {Array} x 
 */

function shuffleArray(x) {
    for (let i = x.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [x[i], x[j]] = [x[j], x[i]];
    };
};

/**
 * 
 * @param {String} commandName 
 * @param {Message} message 
 * @param {String} args
 * @param {Client} client 
 */

async function invalidArgs(commandName, message, args, client) {
    try {
        let color = client.config.color ? client.config.color : "BLURPLE";
        let prefix = await getPrefix(message.guildId, client);
        let command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));
        if (!command) return await message.reply({
            embeds: [new MessageEmbed().setColor(color).setDescription(args)], allowedMentions: {
                repliedUser: false
            }
        }).catch(() => { });
        let embed1 = new MessageEmbed().setColor(color).setAuthor({ name: message.author.tag.toString(), iconURL: message.author.displayAvatarURL({ dynamic: true }).toString() }).setDescription(`**${args}**`).setTitle(`__${command.name}__`).addFields([
            {
                name: "Usage",
                value: `\`${command.usage ? `${prefix}${command.name} ${command.usage}` : `${prefix}${command.name}`}\``,
                inline: false
            }, {
                name: "Example(s)",
                value: `${command.examples ? `\`${prefix}${command.examples.join(`\`\n\`${prefix}`)}\`` : "`" + prefix + command.name + "`"}`
            }
        ]);

        return await message.reply({
            embeds: [embed1],
            allowedMentions: { repliedUser: false }
        });
    } catch (e) {
        console.error(e);
    };
};

/**
 * 
 * @param {TextChannel} channel 
 * @param {String} args 
 * @param {String} color
 */

async function oops(channel, args, color) {
    try {
        let embed1 = new MessageEmbed().setColor(color ? color : "BLURPLE").setDescription(`${args}`);

        const m = await channel.send({
            embeds: [embed1]
        });

        setTimeout(async () => await m.delete().catch(() => { }), 12000);
    } catch (e) {
        return console.error(e)
    }
};

/**
 * 
 * @param {TextChannel} channel 
 * @param {String} args 
 * @param {String} color 
 * @returns {Promise<void | Message}
 */

async function good(channel, args, color) {
    color = color ? color : "BLURPLE";
    return await channel.send({
        embeds: [new MessageEmbed().setColor(color).setDescription(`${args}`)]
    }).catch(() => { });
};

function qeb(embed, player) {
    return embed.addFields([
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
            value: `\`[ ${prettyMilliseconds(player.queue.current.duration)} ]\``,
            inline: true
        }
    ]);
};
/**
 * 
 * @param {*} embed 
 * @param {Player} player 
 * @param {Client} client 
 * @returns 
 */

function neb(embed, player, client) {
    let icon = player.queue.current.identifier ? `https://img.youtube.com/vi/${player.queue.current.identifier}/maxresdefault.jpg` : client.config.links.image;
    return embed.setTitle(`${player.queue.current.title} ~ [${prettyMilliseconds(player.queue.current.duration)}]`).setImage(icon).setFooter({text: `Requested by ${player.queue.current.requester.username}`, iconURL: player.queue.current.requester.displayAvatarURL({ dynamic: true })});
};

/**
 * 
 * @param {String} query 
 * @param {Player} player 
 * @param {Message} message 
 * @param {String} color 
 */

async function playerhandler(query, player, message, color) {
    let m;
    let d = await setupSchema.findOne({ _id: message.guildId });
    let q = new MessageEmbed().setTitle("Queue Stats").setColor(color);
    let n = new MessageEmbed().setColor(color);

    try {
        if (d) m = await message.channel.messages.fetch(d.message, { cache: true });
    } catch (e) { };

    if (!message.guild.me.voice.channel || player.state !== "CONNECTED") player.connect();
    
    let s = await player.search(query, message.author);
    if (s.loadType === "LOAD_FAILED") {
        if (!player.queue.current) player.destroy();
        return await oops(message.channel, `Failed to load ${query}`);
    } else if (s.loadType === "NO_MATCHES") {
        if (!player.queue.current) player.destroy();
        return await oops(message.channel, `No results found for ${query}`);
    } else if (s.loadType === "PLAYLIST_LOADED") {
        if (player.state !== "CONNECTED") player.connect();
        if (player) player.queue.add(s.tracks);
        if (player && player.state === "CONNECTED" && !player.playing && !player.paused && player.queue.totalSize === s.tracks.length) await player.play();

        await message.channel.send({
            embeds: [new MessageEmbed().setColor(color).setDescription(`Added \`[ ${s.tracks.length} ]\` tracks from [${s.playlist.name}](${query}) to the queue.`)]
        }).then((a) => setTimeout(async () => await a.delete().catch(() => { }), 5000)).catch(() => { });

        qeb(q, player);
        neb(n, player);
        if (m) await m.edit({ embeds: [q, n], files: [] }).catch(() => { });
    } else if (s.loadType === "SEARCH_RESULT") {
        if (player.state !== "CONNECTED") player.connect();
        if (player) player.queue.add(s.tracks[0]);
        if (player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) return await player.play();

        await message.channel.send({
            embeds: [new MessageEmbed().setColor(color).setDescription(`Added [${s.tracks[0].title}](${s.tracks[0].uri}) to the queue.`)]
        }).then((a) => setTimeout(async () => await a.delete().catch(() => { }), 5000)).catch(() => { });

        qeb(q, player);
        neb(n, player);
        if (m) await m.edit({ embeds: [q, n], files: [] }).catch(() => { });
    } else if (s.loadType === "TRACK_LOADED") {
        if (player.state !== "CONNECTED") player.connect();
        if (player) player.queue.add(s.tracks[0]);
        if (player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) return await player.play();

        await message.channel.send({
            embeds: [new MessageEmbed().setColor(color).setDescription(`Added [${s.tracks[0].title}](${s.tracks[0].uri}) to the queue.`)]
        }).then((a) => setTimeout(async () => await a.delete().catch(() => { }), 5000)).catch(() => { });

        qeb(q, player);
        neb(n, player);
        if (m) await m.edit({ embeds: [q, n], files: [] }).catch(() => { });
    } else return await oops(message.channel, `No results found for ${query}`);
};

/**
 * 
 * @param {Player} player 
 * @param {Message} message 
 * @param {Client} client
 * @param {String} color 
 */

async function playerQueueHandler(player, message, client, color) {
    if (!player) return await oops(message.channel, `Nothing is playing right now.`);
    if (!player.queue) return await oops(message.channel, `Nothing is playing right now.`);
    if (!player.queue.current) return await oops(message.channel, `Nothing is playing right now.`);
    if (message && message.deletable) await message.delete().catch(() => { });
    const { current } = player.queue;
    if (!player.queue.size) {
        let embed1 = new MessageEmbed().setColor(color).setAuthor({ name: current.requester ? current.requester.tag : client.user.tag.toString(), iconURL: current.requester ? current.requester.displayAvatarURL({ dynamic: true }) : client.user.displayAvatarURL({ dynamic: true }).toString() }).setDescription(`[**__${current.title}__**](${current.uri}) \`[ ${prettyMilliseconds(Number(player.position))} / ${prettyMilliseconds(Number(current.duration))} ]\``).setTitle("Now playing").setImage(current.displayThumbnail() ? current.displayThumbnail("hqdefault") : null).setFooter({ text: "No more songs left in the queue.", iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setTimestamp();

        return await message.channel.send({
            embeds: [embed1]
        }).catch(() => { });
    } else {
        let map = player.queue.map((t, i) => `> \`[ ${++i} ]\` ~ [**__${t.title}__**](${t.uri}) ~ \`[ ${prettyMilliseconds(Number(t.duration))} ]\` ${t.requester ? `~ [${t.requester}]` : ""}`);

        const pages = lodash.chunk(map, 8).map((v) => v.join("\n"));
        let page = 0;

        let embed2 = new MessageEmbed().setTitle(`${message.guild.name} Server Queue`).setColor(color).setDescription(`**Now playing**\n> [**__${current.title}__**](${current.uri}) ~ \`[ ${prettyMilliseconds(Number(current.duration))} / ${prettyMilliseconds(Number(current.duration))} ]\`${current.requester ? ` ~ [${current.requester}]` : ""}\n\n**Queued Songs**\n${pages[page]}`).setThumbnail(current.thumbnail ? current.thumbnail.toString() : null).setFooter({ text: `Page ${page + 1} of ${pages.length}` });

        if (player.queue.size < 9) {
            return await message.channel.send({
                embeds: [embed2]
            }).catch(() => { });
        } else {
            let mbut1 = new MessageButton().setCustomId("a_queue_cmd_button_1_blah_blah_blah").setLabel("<<").setStyle("PRIMARY").setDisabled(false);

            let mbut2 = new MessageButton().setCustomId("a_queue_cmd_button_2_blah_blah_blah").setLabel("X").setStyle("DANGER").setDisabled(false);

            let mbut3 = new MessageButton().setCustomId("a_queue_cmd_button_3_blah_blah_blah").setLabel(">>").setStyle("PRIMARY");

            const row1 = new MessageActionRow().addComponents(mbut1, mbut2, mbut3);

            const m = await message.channel.send({
                embeds: [embed2],
                components: [row1]
            });

            const collector = m.createMessageComponentCollector({
                filter: (b) => {
                    if (b.user.id === message.author.id) return true;
                    else {
                        b.deferUpdate().catch(() => { });
                        return false;
                    };
                },
                time: 60e3 * 5,
                idle: 30e3 * 2
            });

            let stopped = false;

            collector.on("end", async () => {
                if (stopped === true) return;
                if (!m) return;
                const row2 = new MessageActionRow().addComponents(mbut1.setDisabled(true), mbut2.setDisabled(true), mbut3.setDisabled(true));

                await m.edit({
                    components: [row2]
                }).catch(() => { });
            });

            collector.on("collect", async (button) => {
                if (button.customId === mbut1.customId) {
                    await button.deferUpdate().catch(() => { });
                    if (!m) return;
                    page = page - 1 < 0 ? pages.length - 1 : --page;

                    await m.edit({
                        embeds: [embed2.setDescription(`**Now playing**\n> [**__${current.title}__**](${current.uri}) ~ \`[ ${prettyMilliseconds(Number(current.duration))} / ${prettyMilliseconds(Number(current.duration))} ]\`${current.requester ? ` ~ [${current.requester}]` : ""}\n\n**Queued Songs**\n${pages[page]}`).setFooter({ text: `Page ${page + 1} of ${pages.length}` })]
                    }).catch(() => { });
                } else if (button.customId === mbut2.customId) {
                    await button.deferUpdate().catch(() => { });
                    stopped = true;
                    if (!m) return;

                    const row3 = new MessageActionRow().addComponents(mbut1.setDisabled(stopped), mbut2.setDisabled(stopped), mbut3.setDisabled(stopped));
                    await m.edit({
                        components: [row3]
                    }).catch(() => { });
                } else if (button.customId === mbut3.customId) {
                    await button.deferUpdate().catch(() => { });
                    if (!m) return;
                    page = page + 1 < pages.length ? ++page : 0;

                    await m.edit({
                        embeds: [embed2.setDescription(`**Now playing**\n> [**__${current.title}__**](${current.uri}) ~ \`[ ${prettyMilliseconds(Number(current.duration))} / ${prettyMilliseconds(Number(current.duration))} ]\`${current.requester ? ` ~ [${current.requester}]` : ""}\n\n**Queued Songs**\n${pages[page]}`).setFooter({ text: `Page ${page + 1} of ${pages.length}` })]
                    }).catch(() => { });
                } else return;
            });
        }
    }
};

/**
 * -
 * @param {String} id
 * @param {Client} client 
 * @param {Object} options 
 * @param {Boolean} options.create
 * @param {String} options.voice
 * @param {String} options.text
 * @param {Number} options.volume
 * @returns {Promise<void | Player}
 */

function getPlayer(id, client, options = {}) {
    const { create, voice, text, volume } = options;
    let player;
    if (options) {
        if (create === true) {
            player = client.player.create({
                guild: id,
                textChannel: text,
                voiceChannel: voice,
                volume: volume,
                selfDeafen: create
            });
        } else player = client.player.get(id);
    } else {
        player = client.player.get(id);
    };

    return player;
};

/**
 * 
 * @param {Player} player 
 * @param {Message} message 
 * @returns {Promise<void>}
 */

async function loopTrack(player, message) {
    if (!player) return await oops(message.channel, `Nothing is playing right now.`);
    if (!player.queue) return await oops(message.channel, `Nothing is playing right now.`);
    if (!player.queue.current) return await oops(message.channel, `Nothing is playing right now.`);

    if (player.trackRepeat) {
        player.setTrackRepeat(false);
        return await good(message.channel, `Track repeat/loop is now disabled.`);
    } else {
        player.setTrackRepeat(true);
        return await good(message.channel, `Track repeat/loop is now enabled.`);
    };
};

/**
 * 
 * @param {Player} player 
 * @param {Message} message 
 * @returns {Promise<void>}
 */

async function loopQueue(player, message) {
    if (!player) return await oops(message.channel, `Nothing is playing right now.`);
    if (!player.queue) return await oops(message.channel, `Nothing is playing right now.`);
    if (!player.queue.current) return await oops(message.channel, `Nothing is playing right now.`);

    if (player.queueRepeat) {
        player.setQueueRepeat(false);
        if (message && message.deletable) await message.delete().catch(() => { });
        return await good(message.channel, `Queue repeat/loop is now disabled.`);
    } else {
        player.setQueueRepeat(true);
        if (message && message.deletable) await message.delete().catch(() => { });
        return await good(message.channel, `Queue repeat/loop is now enabled.`);
    };
};

/**
 * 
 * @param {Number} ms 
 * @returns {Promise<void>}
 */

function wait(ms) {
    return new Promise((resolve) => setTimeout(() => resolve, ms));
};

/**
 * 
 * @param {String} query 
 * @param {Player} player 
 * @param {Message} message 
 * @param {String} color 
 * @return {Promise<void>}
 */

async function playerSearch(query, player, message, color) {
    const searchSource = ["youtube", "soundcloud"];
    let random = Math.floor(Math.random() * searchSource.length);
    if (random > 1 || random < 0) random = 0;

    const source = searchSource[random];
    const s = await player.search({ query: query, source: source }, message.author);
    if (s.loadType === "LOAD_FAILED") {
        if (!player.queue.current) player.destroy();
        if (message && message.deletable) await message.delete().catch(() => { });
        return await oops(message.channel, `Failed to load ${query}`);

    } else if (s.loadType === "NO_MATCHES") {
        if (!player.queue.current) player.destroy();
        if (message && message.deletable) await message.delete().catch(() => { });
        return await oops(message.channel, `No results found for${query}`);

    } else if (s.loadType === "PLAYLIST_LOADED") {
        let embed1 = new MessageEmbed().setColor(color).setDescription(`**Looks like the search result is a playlist.**\n> [**__${s.playlist.name}__**](${query})\n> \n> *Click Add to add the playlist to queue.*`).setTitle(`Search Result for ${query.length > 200 ? query.substr(0, 200 - 4) + "..." : query}`).setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setTimestamp();

        let but1 = new MessageButton().setCustomId("search_function_fhaifapf.afaf").setLabel("Add").setStyle("PRIMARY").setDisabled(false);

        const row1 = new MessageActionRow().addComponents(but1);

        const msg = await message.channel.send({
            embeds: [embed1],
            components: [row1]
        });

        console.log(row1.components);

        const collector = msg.createMessageComponentCollector({
            filter: (b) => {
                if (b.user.id === message.author.id) return true;
                else {
                    b.deferUpdate().catch(() => { });
                    return false;
                }
            },
            max: 1,
            time: 30e3,
            idle: 15000
        });

        collector.on("end", async () => {
            if (!msg) return;
            const row2 = new MessageActionRow().addComponents(but1.setDisabled(true));
            await msg.edit({
                components: [row2]
            }).catch(() => { });
        });

        collector.on("collect", async (button) => {
            if (button.customId === but1.customId) {
                await button.deferReply({ ephemeral: true }).catch(() => { });
                if (!message.guild.me.voice.channel || player.state !== "CONNECTED") player.connect();
                if (player) player.queue.add(s.tracks);
                if (player && player.state === "CONNECTED" && !player.playing && !player.paused && player.queue.totalSize === s.tracks.length) player.play();

                if (message && message.deletable) await message.delete().catch(() => { });
                return await button.editReply({
                    embeds: [new MessageEmbed().setColor(color).setDescription(`Added \`[ ${s.tracks.length} ]\` tracks from [**__${s.playlist.name}__**](${query}) to the queue.`)]
                }).catch(() => { });
            } else return;
        });
    } else if (s.loadType === "TRACK_LOADED") {
        let embed2 = new MessageEmbed().setColor(color).setDescription(`**Looks like the search result is a track.**\n> [**__${s.tracks[0].title}__**](${s.tracks[0].uri})\n> \n> *Click Add to add the track to queue.*`).setTitle(`Search Result for ${query.length > 200 ? query.substr(0, 200 - 4) + "..." : query}`).setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setTimestamp();

        let but2 = new MessageButton().setCustomId("search_function_fhaifapf.afaf222").setLabel("Add").setStyle("PRIMARY").setDisabled(false);

        const row2 = new MessageActionRow().addComponents(but2);

        const msg = await message.channel.send({
            embeds: [embed2],
            components: [row2]
        });

        console.log(row2.components);

        const collector2 = msg.createMessageComponentCollector({
            filter: (b) => {
                if (b.user.id === message.author.id) return true;
                else {
                    b.deferUpdate().catch(() => { });
                    return false;
                }
            },
            max: 1,
            time: 30e3,
            idle: 15000
        });

        collector2.on("end", async () => {
            if (!msg) return;
            const row3 = new MessageActionRow().addComponents(but2.setDisabled(true));
            await msg.edit({
                components: [row3]
            }).catch(() => { });
        });

        collector2.on("collect", async (button) => {
            if (button.customId === but2.customId) {
                await button.deferReply({ ephemeral: true }).catch(() => { });
                if (!message.guild.me.voice.channel || player.state !== "CONNECTED") player.connect();
                if (player) player.queue.add(s.tracks);
                if (player && player.state === "CONNECTED" && !player.playing && !player.paused && player.queue.totalSize === s.tracks.length) player.play();

                if (message && message.deletable) await message.delete().catch(() => { });
                return await button.editReply({
                    embeds: [new MessageEmbed().setColor(color).setDescription(`Added [**__${s.tracks[0].title}__**](${s.tracks[0].uri}) to the queue.`)]
                }).catch(() => { });
            } else return;
        });
    } else if (s.loadType === "SEARCH_RESULT") {
        const map = s.tracks.map((t, i) => `\`[ ${++i} ]\` ~ [**__${t.title}__**](${t.uri}) ~ \`[ ${prettyMilliseconds(Number(t.duration))} ]\``);

        const pages = lodash.chunk(map, 8).map((v) => v.join("\n"));
        let page = 0;

        let embed1 = new MessageEmbed().setColor(color).setDescription(`**Total Results:** \`[ ${s.tracks.length} ]\`\n\n${pages[page]}\n\n*Type the number of the song that you want \`[ 60 seconds ]\`*`).setTitle(`Search Results for ${query.length > 200 ? query.substr(0, 200 - 4) + "..." : query}`).setFooter({ text: `Page ${page + 1} of ${pages.length}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        let pbut1 = new MessageButton().setCustomId("previous____eeeeeff").setDisabled(false).setEmoji("⬅️").setStyle("SECONDARY");

        let pbut2 = new MessageButton().setCustomId("stop____eeeeeff").setDisabled(false).setEmoji("⏹️").setStyle("DANGER");

        let pbut3 = new MessageButton().setCustomId("next____eeeeeff").setDisabled(false).setEmoji("➡️").setStyle("SECONDARY");

        const row1 = new MessageActionRow().addComponents(pbut1, pbut2, pbut3);
        const m = await message.channel.send({
            embeds: [embed1],
            components: [row1]
        });

        const collector = m.createMessageComponentCollector({
            filter: (b) => {
                if (b.user.id === message.author.id) return true;
                else {
                    b.deferUpdate().catch(() => { });
                    return false;
                }
            },
            time: 60e3 * 5,
            idle: 60e3
        });

        let stopped = false;

        collector.on("end", async () => {
            if (!m) return;
            if (stopped === true) return;

            await m.edit({
                components: [new MessageActionRow().addComponents(pbut1.setDisabled(true), pbut2.setDisabled(true), pbut3.setDisabled(true))]
            }).catch(() => { });
        });

        collector.on("collect", async (button) => {
            if (button.customId === pbut1.customId) {
                await button.deferUpdate().catch(() => { });
                if (!m) return;
                page = page - 1 < 0 ? pages.length - 1 : --page;

                await m.edit({
                    embeds: [embed1.setFooter({ text: `Page ${page + 1} of ${pages.length}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setDescription(`**Total Results:** \`[ ${s.tracks.length} ]\`\n\n${pages[page]}\n\n*Type the number of the song that you want \`[ 60 seconds ]\`*`)]
                }).catch(() => { });
            } else if (button.customId === pbut2.customId) {
                await button.deferUpdate().catch(() => { });
                stopped = true;
                collector.stop();
                if (!m) return;

                await m.edit({
                    components: [new MessageActionRow().addComponents(pbut1.setDisabled(true), pbut2.setDisabled(true), pbut3.setDisabled(true))]
                }).catch(() => { });
            } else if (button.customId === pbut3.customId) {
                await button.deferUpdate().catch(() => { });
                if (!m) return;
                page = page + 1 < pages.length ? ++page : 0;

                await m.edit({
                    embeds: [embed1.setFooter({ text: `Page ${page + 1} of ${pages.length}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setDescription(`**Total Results:** \`[ ${s.tracks.length} ]\`\n\n${pages[page]}\n\n*Type the number of the song that you want \`[ 60 seconds ]\`*`)]
                }).catch(() => { });
            } else return;
        });

        if (stopped === true) return;

        let a1;

        try {
            a1 = await message.channel.awaitMessages({
                filter: (m) => m.author.id === message.author.id,
                max: 1,
                time: 60e3,
                idle: 30e3,
                errors: ["time"]
            });
        } catch (error) {
            collector.stop();
            return await oops(message.channel, `Timeout, better speed up next kiddo`);
        };

        if (!a1 || !a1.first()) return;

        let collected = a1.first().content;
        if (isNaN(collected)) {
            collector.stop();
            return await oops(message.channel, `You've provided an invalid song number.`);
        };

        if (collected < 1) {
            collector.stop();
            return await oops(message.channel, `You've provided an invalid song number.`);
        };

        if (collected > s.tracks.length) {
            collector.stop();
            return await oops(message.channel, `You've provided an invalid song number.`);
        };

        let num = Number(collected) - 1;

        if (!message.guild.me.voice.channel || player.state !== "CONNECTED") player.connect();
        if (player) player.queue.add(s.tracks[num]);
        if (player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) player.play();

        collector.stop();
        return await good(message.channel, `Added [__${s.tracks[num].title}__](${s.tracks[num].uri}) to the queue.`);
    } else {
        if (message && message.deletable) await message.delete().catch(() => { });
        return await oops(message.channel, `No results found for ${query}`);
    };
};

/**
 * 
 * @param {String} query 
 * @param {Player} player 
 * @param {Message} message 
 * @param {String} color 
 */

async function playerNormalManager(query, player, message, color) {
    if (!message.guild.me.voice.channel || player.state !== "CONNECTED") player.connect();
    let s = await player.search(query, message.author);

    if (s.loadType === "LOAD_FAILED") {
        if (player && !player.queue.current) player.destroy();
        return await oops(message.channel, `Failed to load ${query}`);
    } else if (s.loadType === "NO_MATCHES") {
        if (player && !player.queue.current) player.destroy();
        return await oops(message.channel, `No results found for ${query}`);
    } else if (s.loadType === "PLAYLIST_LOADED") {
        if (!message.guild.me.voice.channel || player.state !== "CONNECTED") player.connect();
        if (player) player.queue.add(s.tracks);
        if (player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) return await player.play();

        return await message.reply({
            embeds: [new MessageEmbed().setColor(color).setDescription(`Added \`[ ${s.tracks.length} ]\` from [**__${s.playlist.name}__**](${query}) to the queue.`)]
        }).catch(() => { });
    } else if (s.loadType === "SEARCH_RESULT") {
        let map = s.tracks.slice(0, 3).map((t, i) => `\`[ ${++i} ]\` ~ [**__${t.title}__**](${t.uri}) ~ \`[ ${prettyMilliseconds(Number(t.duration))} ]\``).join("\n");

        let embed1 = new MessageEmbed().setColor(color).setDescription(map.toString()).setTitle("Select the song you want").setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setTimestamp();

        let mbut1 = new MessageButton().setCustomId("play_cmd_fffffffff").setLabel("1").setStyle("PRIMARY").setDisabled(false);

        let mbut2 = new MessageButton().setCustomId("play_cmd_fffffffff222").setLabel("2").setStyle("PRIMARY").setDisabled(false);

        let mbut3 = new MessageButton().setCustomId("play_cmd_fffffffff333").setLabel("3").setStyle("PRIMARY").setDisabled(false);

        let mbut4 = new MessageButton().setCustomId("play_cmd_fffffffff444").setLabel("X").setStyle("DANGER").setDisabled(false);

        const row1 = new MessageActionRow().addComponents(mbut1, mbut2, mbut3, mbut4);

        const m = await message.channel.send({ embeds: [embed1], components: [row1] });

        const collector = m.createMessageComponentCollector({
            filter: (x) => {
                if (x.user.id === message.author.id) return true;
                else {
                    x.deferUpdate().catch(() => { });
                    return false;
                };
            },
            time: 60e3,
            idle: 30e3
        });

        let stopped = false;

        collector.on("end", async () => {
            if (!m) return;

            await m.edit({
                components: [new MessageActionRow().addComponents(mbut1.setDisabled(true), mbut2.setDisabled(true), mbut3.setDisabled(true), mbut4.setDisabled(true))]
            }).catch(() => { });

            if (stopped) return;
            wait(5000);
            if (player && !player.queue.current) player.destroy();
        });

        collector.on("collect", async (button) => {
            if (button.customId === mbut1.customId) {
                await button.deferReply({ ephemeral: true }).catch(() => { });
                if (!message.guild.me.voice.channel || player.state !== "CONNECTED") player.connect();
                if (player) player.queue.add(s.tracks[0]);
                if (player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                await button.editReply({
                    embeds: [new MessageEmbed().setColor(color).setDescription(`Added [**__${s.tracks[0].title}__**](${s.tracks[0].uri}) to the queue.`)]
                }).catch(() => { });

                stopped = true
                return collector.stop();
            } else if (button.customId === mbut2.customId) {
                await button.deferReply({ ephemeral: true }).catch(() => { });
                if (!message.guild.me.voice.channel || player.state !== "CONNECTED") player.connect();
                if (player) player.queue.add(s.tracks[1]);
                if (player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                await button.editReply({
                    embeds: [new MessageEmbed().setColor(color).setDescription(`Added [**__${s.tracks[1].title}__**](${s.tracks[1].uri}) to the queue.`)]
                }).catch(() => { });

                stopped = true
                return collector.stop();
            } else if (button.customId === mbut3.customId) {
                await button.deferReply({ ephemeral: true }).catch(() => { });
                if (!message.guild.me.voice.channel || player.state !== "CONNECTED") player.connect();
                if (player) player.queue.add(s.tracks[2]);
                if (player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                await button.editReply({
                    embeds: [new MessageEmbed().setColor(color).setDescription(`Added [**__${s.tracks[2].title}__**](${s.tracks[2].uri}) to the queue.`)]
                }).catch(() => { });

                stopped = true
                return collector.stop();
            } else if (button.customId === mbut4.customId) {
                await button.deferUpdate().catch(() => { });
                return collector.stop();
            } else return;
        })
    } else if (s.loadType === "TRACK_LOADED") {
        if (!message.guild.me.voice.channel || player.state !== "CONNECTED") player.connect();
        if (player) player.queue.add(s.tracks[0]);
        if (player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) return await player.play();

        return await message.reply({
            embeds: [new MessageEmbed().setColor(color).setDescription(`Added [**__${s.tracks[0].title}__**](${s.tracks[0].uri}) to the queue.`)]
        }).catch(() => { });
    } else return await oops(message.channel, `No results found for ${query}`);
};

/**
 * 
 * @param {String} query 
 * @param {Player} player 
 * @param {CommandInteraction} interaction 
 * @param {String} color 
 * @param {Client} client
 */

async function interactionPlayerHandler(query, player, interaction, color, client) {
    if (!interaction.member.voice.channel) return await interaction.followUp({
        ephemeral: true,
        embeds: [new MessageEmbed().setColor(color).setDescription(`**You are not connected to a voice channel to use this command.**`)]
    }).catch(() => { });

    if (!interaction.member.voice.channel.permissionsFor(client.user).has([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK])) return await interaction.followUp({
        ephemeral: true,
        embeds: [new MessageEmbed().setColor(color).setDescription(`**I don't have enough permissions in ${interaction.member.voice.channel} to execute this command.**`)]
    }).catch(() => { });

    if (!interaction.replied) await interaction.deferReply().catch(() => { });

    if (!interaction.guild.me.voice.channel || player.state !== "CONNECTED") player.connect();
    
    const s = await player.search(query, interaction.user);

    if (s.loadType === "LOAD_FAILED") {
        if (!player.queue.current) player.destroy();
        if (interaction.replied) await interaction.deleteReply().catch(() => { });
        await interaction.followUp({
            ephemeral: true,
            embeds: [new MessageEmbed().setColor(color).setDescription(`**Failed to load ${query}**`)]
        }).catch(() => { });
    } else if (s.loadType === "NO_MATCHES") {
        if (!player.queue.current) player.destroy();
        if (interaction.replied) await interaction.deleteReply().catch(() => { });
        await interaction.followUp({
            ephemeral: true,
            embeds: [new MessageEmbed().setColor(color).setDescription(`**No results found for ${query}**`)]
        }).catch(() => { });
    } else if (s.loadType === "PLAYLIST_LOADED") {
        if (!interaction.guild.me.voice.channel || player.state !== "CONNECTED") player.connect();
        if (player) player.queue.add(s.tracks);
        if (player && player.state === "CONNECTED" && !player.playing && !player.paused && player.queue.totalSize === s.tracks.length) await player.play();

        return await interaction.editReply({
            embeds: [new MessageEmbed().setColor(color).setDescription(`Added \`[ ${s.tracks.length} ]\` tracks from [**__${s.playlist.name}__**](${query}) to the queue.`)]
        }).catch(() => { });
    } else if (s.loadType === "TRACK_LOADED") {
        if (!interaction.guild.me.voice.channel || player.state !== "CONNECTED") player.connect();
        if (player) player.queue.add(s.tracks[0]);
        if (player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

        return await interaction.editReply({
            embeds: [new MessageEmbed().setColor(color).setDescription(`Added [**__${s.tracks[0].title}__**](${s.tracks[0].uri}) to the queue.`)]
        }).catch(() => { });
    } else if (s.loadType === "SEARCH_RESULT") {
        let map = s.tracks.slice(0, 3).map((t, i) => `\`[ ${++i} ]\` ~ [**__${t.title}__**](${t.uri}) ~ \`[ ${prettyMilliseconds(Number(t.duration))} ]\``).join("\n");

        let embed1 = new MessageEmbed().setColor(color).setDescription(`${map}`).setTitle("Select the song that you want").setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) }).setTimestamp();

        let but1 = new MessageButton().setCustomId("play_interaction_but_1").setLabel("1").setStyle("PRIMARY");

        let but2 = new MessageButton().setCustomId("play_interaction_but_2").setLabel("2").setStyle("PRIMARY");

        let but3 = new MessageButton().setCustomId("play_interaction_but_3").setLabel("3").setStyle("PRIMARY");

        let but4 = new MessageButton().setCustomId("play_interaction_but_4").setLabel("X").setStyle("DANGER");

        const row1 = new MessageActionRow().addComponents(but1, but2, but3, but4);

        await interaction.editReply({
            embeds: [embed1],
            components: [row1]
        }).catch(() => { });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: (b) => {
                if (b.user.id === interaction.user.id) return true
                else {
                    b.deferUpdate().catch(() => { });
                    return false;
                };
            },
            max: 1,
            time: 60e3,
            idle: 30e3
        });

        collector.on("end", async () => {
            return await interaction.editReply({
                components: [new MessageActionRow().addComponents(but1.setDisabled(true), but2.setDisabled(true), but3.setDisabled(true), but4.setDisabled(true))]
            }).catch(() => { });
        });

        collector.on("collect", async (button) => {
            if (button.customId === but1.customId) {
                await button.deferReply({ ephemeral: true }).catch(() => { });
                if (interaction.guild.me.voice.channel || player.state !== "CONNECTED") player.connect();
                if (player) player.queue.add(s.tracks[0]);
                if (player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                return await button.editReply({
                    embeds: [new MessageEmbed().setColor(color).setDescription(`Added [**__${s.tracks[0].title}__**](${s.tracks[0].uri}) to the queue.`)]
                }).catch(() => { });
            } else if (button.customId === but2.customId) {
                await button.deferReply({ ephemeral: true }).catch(() => { });
                if (interaction.guild.me.voice.channel || player.state !== "CONNECTED") player.connect();
                if (player) player.queue.add(s.tracks[1]);
                if (player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                return await button.editReply({
                    embeds: [new MessageEmbed().setColor(color).setDescription(`Added [**__${s.tracks[1].title}__**](${s.tracks[1].uri}) to the queue.`)]
                }).catch(() => { });
            } else if (button.customId === but3.customId) {
                await button.deferReply({ ephemeral: true }).catch(() => { });
                if (interaction.guild.me.voice.channel || player.state !== "CONNECTED") player.connect();
                if (player) player.queue.add(s.tracks[2]);
                if (player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                return await button.editReply({
                    embeds: [new MessageEmbed().setColor(color).setDescription(`Added [**__${s.tracks[2].title}__**](${s.tracks[2].uri}) to the queue.`)]
                }).catch(() => { });
            } else if (button.customId === but4.customId) {
                await button.deferUpdate().catch(() => { });
            } else return;
        })
    } else {
        if (!player.queue.current) player.destroy();
        if (interaction.replied) await interaction.deleteReply().catch(() => { });
        await interaction.followUp({
            ephemeral: true,
            embeds: [new MessageEmbed().setColor(color).setDescription(`**No results found for ${query}**`)]
        }).catch(() => { });
    };
};

/**
 * 
 * @param {String} msgId
 * @param {TextChannel} channel 
 * @param {import("erela.js").Player} player 
 * @param {import("erela.js").Track} track 
 * @param {Client} client
 * @param {String} color
 */

async function trackStartEventHandler(msgId, channel, player, track, client, color) {
    try {

        let icon = player.queue.current.identifier ? `https://img.youtube.com/vi/${player.queue.current.identifier}/maxresdefault.jpg` : client.config.links.image;

        let message;
        try {

            message = await channel.messages.fetch(msgId, { cache: true });

        } catch (error) { };

        if (!message) {
            let embed2 = new MessageEmbed().setColor(color).setTitle(`${track.title} ~ [${prettyMilliseconds(track.duration)}]`).setImage(icon).setFooter({ text: `Requested by ${track.requester ? track.requester.username : "Unknown User"}`, iconURL: track.requester.displayAvatarURL({ dynamic: true }) });

            let embed1 = new MessageEmbed().setColor(color).setTitle("Queue Stats").addFields([
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
                    value: `\`[ ${prettyMilliseconds(track.duration)} ]\``,
                    inline: true
                }
            ]);

            let pausebut = new MessageButton().setCustomId(`pause_but_${player.guild}`).setEmoji("⏸️").setStyle("SECONDARY").setDisabled(false);

            let lowvolumebut = new MessageButton().setCustomId(`lowvolume_but_${player.guild}`).setEmoji("🔉").setStyle("SECONDARY").setDisabled(false);

            let highvolumebut = new MessageButton().setCustomId(`highvolume_but_${player.guild}`).setEmoji("🔊").setStyle("SECONDARY").setDisabled(false);

            let previousbut = new MessageButton().setCustomId(`previous_but_${player.guild}`).setEmoji("⏮️").setStyle("SECONDARY").setDisabled(false);

            let skipbut = new MessageButton().setCustomId(`skipbut_but_${player.guild}`).setEmoji("⏭️").setStyle("SECONDARY").setDisabled(false);

            let rewindbut = new MessageButton().setCustomId(`rewindbut_but_${player.guild}`).setEmoji("⏪").setStyle("SECONDARY").setDisabled(false);

            let forwardbut = new MessageButton().setCustomId(`forward_but_${player.guild}`).setEmoji("⏩").setStyle("SECONDARY").setDisabled(false);

            let toggleautoplaybut = new MessageButton().setCustomId(`autoplay_but_${player.guild}`).setEmoji("♾️").setStyle("SECONDARY").setDisabled(false);

            let loopmodesbut = new MessageButton().setCustomId(`loopmodesbut_but_${player.guild}`).setEmoji("🔁").setStyle("SECONDARY").setDisabled(false);

            let stopbut = new MessageButton().setCustomId(`stop_but_${player.guild}`).setEmoji("⏹️").setStyle("SECONDARY").setDisabled(false);

            const row1 = new MessageActionRow().addComponents(lowvolumebut, previousbut, pausebut, skipbut, highvolumebut);

            const row2 = new MessageActionRow().addComponents(rewindbut, toggleautoplaybut, stopbut, loopmodesbut, forwardbut);

            const m = await channel.send({
                content: "__**Join a voice channel and queue songs by name/url.**__\n\n",
                embeds: [embed1, embed2],
                components: [row1, row2]
            });

            return await setupSchema.findOneAndUpdate({ _id: channel.guildId }, { message: m.id });
        } else {
            let embed1 = new MessageEmbed().setColor(color).setTitle("Queue Stats").addFields([
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
                    value: `\`[ ${prettyMilliseconds(track.duration)} ]\``,
                    inline: true
                }
            ]);

            let embed2 = new MessageEmbed().setColor(color).setTitle(`${track.title} ~ [${prettyMilliseconds(track.duration)}]`).setImage(icon).setFooter({ text: `Requested by ${track.requester ? track.requester.username : "Unknown User"}`, iconURL: track.requester.displayAvatarURL({ dynamic: true }) });

            await message.edit({
                content: "__**Join a voice channel and queue songs by name/url.**__\n",
                embeds: [embed1, embed2]
            });
        };
    } catch (error) {
        return console.error(error);
    }
};


/**
 * 
 * @param {CommandInteraction | ButtonInteraction | SelectMenuInteraction} interaction 
 * @param {String} args 
 * @param {String} color
 */

async function intReply(interaction, args, color) {
    if (typeof color !== "string") color = "BLURPLE";

    if (!interaction) return;

    if (interaction.replied) {
        return await interaction.editReply({
            embeds: [new MessageEmbed().setColor(color).setDescription(`${args}`)]
        }).catch(() => { });
    } else {
        return await interaction.followUp({
            ephemeral: true,
            embeds: [new MessageEmbed().setColor(color).setDescription(`${args}`)]
        }).catch(() => { });
    };
};


/**
 * 
 * @param {Player} player 
 * @param {Number} num
 * @param {CommandInteraction} interaction 
 * @param {String} color 
 * @returns {Promise<void>}
 */

async function interactionQueueHandler(player, num, interaction, color) {
    if (!interaction.replied) await interaction.deferReply().catch(() => { });
    if (!player || !player.queue || !player.queue.current) return await intReply(interaction, `Nothing is playing right now.`, color);
    if (!interaction.member.voice.channel) return await intReply(interaction, "You are not connected to a voice channel to use this command.", color);

    if (interaction.guild.me.voice.channel && interaction.guild.me.voice.channelId !== interaction.member.voice.channelId) return await intReply(interaction, `You are not connected to <#${interaction.guild.me.voice.channelId}> to use this command.`, color);

    if (player && player.state !== "CONNECTED") {
        player.destroy();
        return await intReply(interaction, "Nothing is playing right now.", color);
    };

    if (!player.queue.size) {
        let embed1 = new MessageEmbed().setColor(color).setDescription(`[${player.queue.current.title}](${player.queue.current.uri}) ~ \`[ ${prettyMilliseconds(Number(player.queue.current.duration))} ]\``).setTitle("Now playing").setImage(player.queue.current.displayThumbnail("maxresdefault")).setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) }).setTimestamp();

        return await interaction.editReply({
            embeds: [embed1]
        }).catch(() => { });
    } else {
        let map = player.queue.map((t, i) => `> \`[ ${++i} ]\` ~ ${t.title && t.uri ? `[${t.title}](${t.uri})` : t.title} ~ \`[ ${prettyMilliseconds(Number(t.duration))} ]\` ~ [${t.requester}]`);

        const pages = lodash.chunk(map, 8).map((v) => v.join("\n"));
        let page = num - 1;
        if (page < 0) page = 0;
        if (page >= pages.length) page = 0;

        let embed2 = new MessageEmbed().setColor(color).setDescription(`**Now playing**\n> [${player.queue.current.title}](${player.queue.current.uri}) ~ \`[ ${prettyMilliseconds(Number(player.position))} / ${prettyMilliseconds(Number(player.queue.current.duration))} ]\`\n\n**Queued Songs**\n${pages[page]}`).setTitle(`${interaction.guild.name} Server Queue`).setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

        if (player.queue.size <= 8) {
            return await interaction.editReply({
                embeds: [embed2]
            }).catch(() => { });

        } else {

            embed2.setFooter({ text: `Page ${page + 1} of ${pages.length}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            let highpreviousbut = new MessageButton().setCustomId(`queue_cmd_sus_previous_but_${interaction.guildId}`).setStyle("SECONDARY").setEmoji("⏮️");

            let highnextbut = new MessageButton().setCustomId(`queue_cmd_sus_next_but_${interaction.guildId}`).setStyle("SECONDARY").setEmoji("⏭️");

            let previousbut = new MessageButton().setCustomId(`queue_cmd_previous_but_${interaction.guildId}`).setStyle("SECONDARY").setEmoji("⬅️");

            let stopbut = new MessageButton().setCustomId(`queue_cmd_stop_but_${interaction.guildId}`).setStyle("SECONDARY").setEmoji("⏹️");

            let nextbut = new MessageButton().setCustomId(`queue_cmd_next_but_${interaction.guildId}`).setStyle("SECONDARY").setEmoji("➡️");

            if (page <= 0) previousbut.setDisabled(true) && highpreviousbut.setDisabled(true);
            else previousbut.setDisabled(false);
            if (page + 1 >= pages.length) nextbut.setDisabled(true) && highnextbut.setDisabled(true);
            else nextbut.setDisabled(false);

            await interaction.editReply({
                embeds: [embed2],
                components: [new MessageActionRow().addComponents([highpreviousbut, previousbut, stopbut, nextbut, highnextbut])]
            }).catch(() => { });

            const collector = interaction.channel.createMessageComponentCollector({
                filter: (b) => {
                    if (b.user.id === interaction.user.id) return true;
                    else {
                        b.deferUpdate().catch(() => { });
                        return false;
                    };
                },
                time: 60e3 * 5,
                idle: 60e3 * 5 / 2
            });

            collector.on("end", async () => {
                await interaction.editReply({
                    components: [new MessageActionRow().addComponents([highpreviousbut.setDisabled(true), previousbut.setDisabled(true), stopbut.setDisabled(true), nextbut.setDisabled(true), highnextbut.setDisabled(true)])]
                }).catch(() => { });
            });

            collector.on("collect", async (button) => {
                if (button.customId === previousbut.customId) {
                    await button.deferUpdate().catch(() => { });
                    page = page - 1 < 0 ? pages.length - 1 : --page;

                    if (page <= 0) previousbut.setDisabled(true) && highpreviousbut.setDisabled(true);
                    else previousbut.setDisabled(false) && highpreviousbut.setDisabled(false);
                    if (page + 1 >= pages.length) nextbut.setDisabled(true) && highnextbut.setDisabled(true);
                    else nextbut.setDisabled(false) && highnextbut.setDisabled(false);

                    await interaction.editReply({
                        embeds: [embed2.setDescription(`**Now playing**\n> [${player.queue.current.title}](${player.queue.current.uri}) ~ \`[ ${prettyMilliseconds(Number(player.position))} / ${prettyMilliseconds(Number(player.queue.current.duration))} ]\`\n\n**Queued Songs**\n${pages[page]}`).setFooter({ text: `Page ${page + 1} of ${pages.length}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })],
                        components: [new MessageActionRow().addComponents([highpreviousbut, previousbut, stopbut, nextbut, highnextbut])]
                    }).catch(() => { });
                } else if (button.customId === nextbut.customId) {
                    await button.deferUpdate().catch(() => { });
                    page = page + 1 < pages.length ? ++page : 0;

                    if (page <= 0) previousbut.setDisabled(true) && highpreviousbut.setDisabled(true);
                    else previousbut.setDisabled(false) && highpreviousbut.setDisabled(false);
                    if (page + 1 >= pages.length) nextbut.setDisabled(true) && highnextbut.setDisabled(true);
                    else nextbut.setDisabled(false) && highnextbut.setDisabled(false);

                    await interaction.editReply({
                        embeds: [embed2.setDescription(`**Now playing**\n> [${player.queue.current.title}](${player.queue.current.uri}) ~ \`[ ${prettyMilliseconds(Number(player.position))} / ${prettyMilliseconds(Number(player.queue.current.duration))} ]\`\n\n**Queued Songs**\n${pages[page]}`).setFooter({ text: `Page ${page + 1} of ${pages.length}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })],
                        components: [new MessageActionRow().addComponents([highpreviousbut, previousbut, stopbut, nextbut, highnextbut])]
                    }).catch(() => { });
                } else if (button.customId === stopbut.customId) {
                    await button.deferUpdate().catch(() => { });
                    return collector.stop();
                } else if (button.customId === highpreviousbut.customId) {
                    await button.deferUpdate().catch(() => { });
                    if (page <= 0) return;
                    page = 0;

                    if (page <= 0) previousbut.setDisabled(true) && highpreviousbut.setDisabled(true);
                    else previousbut.setDisabled(false) && highpreviousbut.setDisabled(false);
                    if (page + 1 >= pages.length) nextbut.setDisabled(true) && highnextbut.setDisabled(true);
                    else nextbut.setDisabled(false) && highnextbut.setDisabled(false);

                    await interaction.editReply({
                        embeds: [embed2.setDescription(`**Now playing**\n> [${player.queue.current.title}](${player.queue.current.uri}) ~ \`[ ${prettyMilliseconds(Number(player.position))} / ${prettyMilliseconds(Number(player.queue.current.duration))} ]\`\n\n**Queued Songs**\n${pages[page]}`).setFooter({ text: `Page ${page + 1} of ${pages.length}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })],
                        components: [new MessageActionRow().addComponents([highpreviousbut, previousbut, stopbut, nextbut, highnextbut])]
                    }).catch(() => { });
                } else if (button.customId === highnextbut.customId) {
                    await button.deferUpdate().catch(() => { });

                    if (page + 1 >= pages.length) return;
                    page = pages.length - 1;

                    if (page <= 0) previousbut.setDisabled(true) && highpreviousbut.setDisabled(true);
                    else previousbut.setDisabled(false) && highpreviousbut.setDisabled(false);
                    if (page + 1 >= pages.length) nextbut.setDisabled(true) && highnextbut.setDisabled(true);
                    else nextbut.setDisabled(false) && highnextbut.setDisabled(false);

                    await interaction.editReply({
                        embeds: [embed2.setDescription(`**Now playing**\n> [${player.queue.current.title}](${player.queue.current.uri}) ~ \`[ ${prettyMilliseconds(Number(player.position))} / ${prettyMilliseconds(Number(player.queue.current.duration))} ]\`\n\n**Queued Songs**\n${pages[page]}`).setFooter({ text: `Page ${page + 1} of ${pages.length}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })],
                        components: [new MessageActionRow().addComponents([highpreviousbut, previousbut, stopbut, nextbut, highnextbut])]
                    }).catch(() => { });
                } else return;
            });
        }
    };

};

/**
 * 
 * @param {String} query 
 * @param {Player} player 
 * @param {CommandInteraction} interaction 
 * @param {Client} client
 * @param {String} color 
 */

async function interactionSearchhandler(query, player, interaction, client, color) {
    if (!interaction.replied) await interaction.deferReply().catch(() => { });

    if (!interaction.member.voice.channel) return await intReply(interaction, "You are not connected to a voice channel to use this command.", color);

    if (interaction.guild.me.voice.channel) {
        if (interaction.member.voice.channel !== interaction.guild.me.voice.channel) return await intReply(interaction, `You are not connected to ${interaction.guild.me.voice.channel} to use this command.`, color);
    };

    if (!player) player = client.player.create({
        guild: interaction.guildId,
        textChannel: interaction.channelId,
        voiceChannel: interaction.member.voice.channelId,
        volume: 80,
        selfDeafen: true
    });

    const s = await player.search(query, interaction.user);

    if (s.loadType === "LOAD_FAILED") {
        if (player && !player.queue.current) player.destroy();
        return await intReply(interaction, `No results found for ${query}`, color);

    } else if (s.loadType === "NO_MATCHES") {
        if (player && !player.queue.current) player.destroy();
        return await intReply(interaction, `No results found for ${query}`, color);

    } else if (s.loadType === "PLAYLIST_LOADED") {
        let embed1 = new MessageEmbed().setColor(color).setDescription(`Looks like the search result is a playlist.\n\n[${s.playlist.name}](${query})`);

        let addbutton = new MessageButton().setCustomId(`search_cmd_button_${interaction.guildId}`).setLabel("Add").setStyle("PRIMARY");

        await interaction.editReply({
            embeds: [embed1],
            components: [new MessageActionRow().addComponents(addbutton)]
        }).catch(() => { });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: (b) => {
                if (b.user.id === interaction.user.id) return true;
                else {
                    b.deferUpdate().catch(() => { });
                    return false;
                };
            },
            time: 30e3,
            max: 1
        });

        collector.on("end", async () => {
            await interaction.editReply({
                components: [new MessageActionRow().addComponents(addbutton.setDisabled(true))]
            }).catch(() => { });
        });

        collector.on("collect", async (button) => {
            if (button.customId === addbutton.customId) {
                await button.deferUpdate().catch(() => { });
                if (!player) return await interaction.editReply({ embeds: [new MessageEmbed().setColor(color).setDescription(`Search canceled due to player not found.`)] }).catch(() => { });

                if (player.state !== "CONNECTED") player.connect();
                if (player) player.queue.add(s.tracks);
                if (player && player.state === "CONNECTED" && !player.playing && !player.paused && player.queue.totalSize === s.tracks.length) player.play();

                return await interaction.editReply({ embeds: [embed1.setDescription(`Added \`[ ${s.tracks.length} ]\` track(s) from [${s.playlist.name}](${query}) to the queue.`)] })
            } else return;
        });
    } else if (s.loadType === "TRACK_LOADED") {
        let embed2 = new MessageEmbed().setColor(color).setDescription(`Looks like the result is a track.\n\n[${s.tracks[0].title}](${s.tracks[0].uri})`);

        let trackaddbutton = new MessageButton().setCustomId(`search_cmd_track_add_${interaction.guildId}`).setStyle("PRIMARY").setLabel("Add");

        await interaction.editReply({
            embeds: [embed2],
            components: [new MessageActionRow().addComponents(trackaddbutton)]
        }).catch(() => { });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: (b) => {
                if (b.user.id === interaction.user.id) return true;
                else {
                    b.deferUpdate().catch(() => { });
                    return false;
                };
            },
            time: 30e3,
            max: 1
        });

        collector.on("end", async () => {
            await interaction.editReply({
                components: [new MessageActionRow().addComponents(trackaddbutton.setDisabled(true))]
            }).catch(() => { });
        });

        collector.on("collect", async (button) => {
            if (button.customId === trackaddbutton.customId) {
                await button.deferUpdate().catch(() => { });
                if (!player) return await interaction.editReply({ embeds: [new MessageEmbed().setColor(color).setDescription(`Search canceled due to player not found.`)] }).catch(() => { });

                if (player.state !== "CONNECTED") player.connect();
                if (player) player.queue.add(s.tracks[0]);
                if (player && player.state === "CONNECTED" && !player.playing && !player.paused && player.queue.totalSize === s.tracks.length) player.play();

                return await interaction.editReply({ embeds: [embed2.setDescription(`Added [${s.tracks[0].title}](${s.tracks[0].uri}) to the queue.`)] }).catch(() => { });
            } else return;
        });
    } else if (s.loadType === "SEARCH_RESULT") {
        let map = s.tracks.map((t, i) => `> \`[ ${++i} ]\` ~ [${t.title}](${t.uri}) ${t.duration ? `~ \`[ ${prettyMilliseconds(Number(t.duration))} ]\`` : ""}`);

        const pages = lodash.chunk(map, 8).map((value) => value.join("\n"));
        let page = 0;

        let substrQuery = query;
        if (substrQuery.length > 150) substrQuery = query.substr(0, 150 - 4) + "...";

        let embed2 = new MessageEmbed().setColor(color).setDescription(`**Total Results:** \`[ ${s.tracks.length} ]\`\n\n${pages[page]}\n\nType in the number of song that you want (60s).`).setTitle(`Search Result(s) for ${substrQuery}`).setFooter({ text: `Page ${page + 1} of ${pages.length}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

        if (pages.length <= 1) {
            let a2;

            try {
                a2 = await interaction.channel.awaitMessages({
                    filter: (m) => m.author.id === interaction.user.id,
                    max: 1,
                    time: 60e3,
                    errors: ["time"]
                });
            } catch (error) {
                return await interaction.followUp({
                    ephemeral: true,
                    embeds: [new MessageEmbed().setColor(color).setDescription(`Timeout, better speed up next time.`)]
                }).catch(() => { });
            };

            let first = a2.first().content;
            let content = null;
            if (first) content = parseInt(first);

            if (isNaN(content)) {
                return await interaction.followUp({
                    ephemeral: true,
                    embeds: [new MessageEmbed().setColor(color).setDescription(`You've provided an invalid track number.`)]
                }).catch(() => { });
            };

            if (content <= 0) {
                return await interaction.followUp({
                    ephemeral: true,
                    embeds: [new MessageEmbed().setColor(color).setDescription(`You've provided an invalid track number.`)]
                }).catch(() => { });
            };

            if (content > s.tracks.length) {
                return await interaction.followUp({
                    ephemeral: true,
                    embeds: [new MessageEmbed().setColor(color).setDescription(`You've provided an invalid track number.`)]
                }).catch(() => { });
            };

            let trackNumber = Number(content) - 1;
            if (player.state !== "CONNECTED") player.connect();
            if (player) player.queue.add(s.tracks[trackNumber]);
            if (player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

            return await interaction.followUp({
                ephemeral: true,
                embeds: [new MessageEmbed().setColor(color).setDescription(`Added [${s.tracks[trackNumber].title}](${s.tracks[trackNumber].uri}) to the queue.`)]
            }).catch(() => { });
        } else {
            let previousbut = new MessageButton().setCustomId(`previous_button_$search_command`).setEmoji("⬅️").setStyle("SECONDARY");

            let stopbut = new MessageButton().setCustomId(`stop_button_$search_command`).setEmoji("⏹️").setStyle("SECONDARY");

            let nextbut = new MessageButton().setCustomId(`next_button_$search_command`).setEmoji("➡️").setStyle("SECONDARY");

            await interaction.editReply({
                embeds: [embed2],
                components: [new MessageActionRow().addComponents(previousbut, stopbut, nextbut)]
            }).catch(() => { });

            const collector = interaction.channel.createMessageComponentCollector({
                filter: (b) => {
                    if (b.user.id === interaction.user.id) return true;
                    else {
                        b.deferUpdate().catch(() => { });
                        return false;
                    };
                },
                time: 60e3
            });

            let stopped = false;

            collector.on("end", async () => {
                if (stopped === true) return;
                await interaction.editReply({
                    components: [new MessageActionRow().addComponents(previousbut.setDisabled(true), stopbut.setDisabled(true), nextbut.setDisabled(true))]
                }).catch(() => { });
            });

            collector.on("collect", async (button) => {
                if (button.customId === previousbut.customId) {
                    await button.deferUpdate().catch(() => { });
                    page = page - 1 < 0 ? pages.length - 1 : --page;

                    await interaction.editReply({
                        embeds: [embed2.setDescription(`**Total Results:** \`[ ${s.tracks.length} ]\`\n\n${pages[page]}\n\nType in the number of song that you want (60s).`).setFooter({ text: `Page ${page + 1} of ${pages.length}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })]
                    }).catch(() => { });
                } else if (button.customId === stopbut.customId) {
                    await button.deferUpdate().catch(() => { });
                    stopped = true;
                    await interaction.editReply({
                        components: [new MessageActionRow().addComponents(previousbut.setDisabled(true), stopbut.setDisabled(true), nextbut.setDisabled(true))]
                    }).catch(() => { });
                    return collector.stop();
                } else if (button.customId === nextbut.customId) {
                    await button.deferUpdate().catch(() => { });
                    page = page + 1 < pages.length ? ++page : 0;

                    await interaction.editReply({
                        embeds: [embed2.setDescription(`**Total Results:** \`[ ${s.tracks.length} ]\`\n\n${pages[page]}\n\nType in the number of song that you want (60s).`).setFooter({ text: `Page ${page + 1} of ${pages.length}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })]
                    }).catch(() => { });
                } else return;
            });

            let a1;

            try {
                a1 = await interaction.channel.awaitMessages({
                    filter: (m) => m.author.id === interaction.user.id,
                    max: 1,
                    time: 60e3,
                    errors: ["time"]
                });
            } catch (error) {
                if (stopped === true) return;
                collector.stop();

                return await interaction.followUp({
                    ephemeral: true,
                    embeds: [new MessageEmbed().setColor(color).setDescription(`Timeout, better speed up next time.`)]
                }).catch(() => { });
            };

            let first = a1.first().content;
            let content = null;
            if (first) content = parseInt(first);
            if (isNaN(content)) {
                if (stopped) return;
                collector.stop();

                return await interaction.followUp({
                    ephemeral: true,
                    embeds: [new MessageEmbed().setColor(color).setDescription(`You've provided an invalid track number.`)]
                }).catch(() => { });
            };

            if (content <= 0) {
                if (stopped === true) return;
                collector.stop();

                return await interaction.followUp({
                    ephemeral: true,
                    embeds: [new MessageEmbed().setColor(color).setDescription(`You've provided an invalid track number.`)]
                }).catch(() => { });
            };

            if (content > s.tracks.length) {
                if (stopped === true) return;
                collector.stop();

                return await interaction.followUp({
                    ephemeral: true,
                    embeds: [new MessageEmbed().setColor(color).setDescription(`You've provided an invalid track number.`)]
                }).catch(() => { });
            };

            let trackNumber = Number(content) - 1;

            if (trackNumber < 0) {
                if (stopped === true) return;
                collector.stop();

                return await interaction.followUp({
                    ephemeral: true,
                    embeds: [new MessageEmbed().setColor(color).setDescription(`You've provided an invalid track number.`)]
                }).catch(() => { });
            };

            if (trackNumber >= s.tracks.length) {
                if (stopped === true) return;
                collector.stop();

                return await interaction.followUp({
                    ephemeral: true,
                    embeds: [new MessageEmbed().setColor(color).setDescription(`You've provided an invalid track number.`)]
                }).catch(() => { });
            };

            if (player.state !== "CONNECTED") player.connect();
            if (player) player.queue.add(s.tracks[trackNumber]);
            if (player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

            if (stopped !== true) collector.stop();
            return await interaction.followUp({
                ephemeral: true,
                embeds: [new MessageEmbed().setColor(color).setDescription(`Added [${s.tracks[trackNumber].title}](${s.tracks[trackNumber].uri}) to the queue.`)]
            }).catch(() => { });
        };

    } else {
        if (player && !player.queue.current) player.destroy();
        return await intReply(interaction, `No results found for ${query}`, color);
    };

};

/**
 * 
 * @param {CommandInteraction | ButtonInteraction | SelectMenuInteraction} interaction 
 * @param {bigint} permission
 * @return {Promise<Boolean | void>}
 */

async function intCheck(interaction, permission) {
    let data = await djroleSchema.findOne({ _id: interaction.guildId });
    let check = false;

    if (!data) {
        if (interaction.member.permissions.has(permission)) check = true;
    } else {
        if (data.mode) {
            let pass = false;

            if (data.roles.length > 0) {
                interaction.member.roles.cache.forEach((x) => {
                    let role = data.roles.find((r) => r === x.id);
                    if (role) pass = true;
                });
            };

            if (!pass) {
                if (interaction.member.permissions.has(permission)) check = true;
                else check = false;
            } else {
                check = true;
            };
        } else {
            check = true;
        };
    };

    return check;
};

/**
 * 
 * @param {Player} player 
 * @param {User} requester 
 */

async function autoplay(player, requester) {
    let result = "";
    let added = 0;
    let failed = 0;
    let random = Math.floor(Math.random() * songs.length);
    if (random < 0) random = 0;
    else if (random >= songs.length) random = 0;

    let res = await player.search(songs[random], requester);
    if (res.loadType === "PLAYLIST_LOADED") {
        result = "added";
        ++added;
        if (player) player.queue.add(res.tracks);
        if (player && player.state === "CONNECTED" && !player.paused && !player.playing && player.queue.size === res.tracks.length) player.play();
    } else if (res.loadType === "SEARCH_RESULT") {
        ++added;
        if (player) player.queue.add(res.tracks[0]);
        if (player && player.state === "CONNECTED" && !player.paused && !player.playing && !player.queue.size) player.play();
    } else if (res.loadType === "TRACK_LOADED") {
        ++added;
        if (player) player.queue.add(res.tracks[0]);
        if (player && player.state === "CONNECTED" && !player.paused && !player.playing && !player.queue.size) player.play();
    } else if (res.loadType === "NO_MATCHES") {
        ++failed;
    } else if (res.loadType === "LOAD_FAILED") {
        ++failed;
    };

    if (added >= failed) result = "added";
    else result = "failed";

    return result;
};

/**
 * 
 * @param {Array} array 
 * @param {Number} trackNumber 
 * @param {Number} to 
 */

function moveArray(array, trackNumber, to) {
    array = [...array];
    const s = trackNumber < 0 ? array.length + trackNumber : trackNumber;
    if (s >= 0 && s < array.length) {
        const e = to < 0 ? array.length + to : to;
        const [i] = array.splice(trackNumber, 1);
        array.splice(e, 0, i);
    };

    return array;
};
/**
 * 
 * 
 * @param {Message} message Message
 * @param {String} args Arguments
 * @param {String} color Color
 * @returns {Promise<Message>}
 * 
 * returns a message
 */

async function msgReply(message, args, color) {
    if (!color) color = "BLURPLE";

    return await message.reply({
        embeds: [new MessageEmbed().setColor(color).setDescription(args)]
    });
};

/**
 * 
 * @param {ButtonInteraction} int 
 * @param {String} args 
 * @param {String} color 
 */

async function buttonReply(int, args, color) {
    if (!color) color = "BLURPLE";

    if (int.replied) {
        await int.editReply({ embeds: [new MessageEmbed().setColor(color).setAuthor({name: int.member.user.tag, iconURL: int.member.user.displayAvatarURL({ dynamic: true })}).setDescription(args)] })
    } else {
        await int.followUp({ embeds: [new MessageEmbed().setColor(color).setAuthor({name: int.member.user.tag, iconURL: int.member.user.displayAvatarURL({ dynamic: true })}).setDescription(args)] })
    };

    setTimeout(async () => {
        if (int && !int.ephemeral) {
            await int.deleteReply().catch(() => { });
        };
    }, 2000);
};

/**
 * 
 * @param {Message} msg 
 * @param {String} args 
 * @param {String} color 
 * @returns {Promise<Message | void>}
 */

async function replyOops(msg, args, color) {
    if (!msg) return;
    if (!args) return;
    if (!color) color = "BLURPLE";

    let embed = new MessageEmbed().setColor(color).setDescription(`${args}`);
    let m = await msg.reply({ embeds: [embed] });

    setTimeout(async () => {
        if (m && m.deletable) await m.delete().catch(() => { });
    }, 7000);
};

module.exports = {
    replyOops,
    buttonReply,
    msgReply,
    getPrefix,
    invalidArgs,
    oops,
    good,
    playerhandler,
    playerQueueHandler,
    getPlayer,
    loopTrack,
    loopQueue,
    playerSearch,
    playerNormalManager,
    wait,
    interactionPlayerHandler,
    trackStartEventHandler,
    intReply,
    interactionQueueHandler,
    interactionSearchhandler,
    intCheck,
    shuffleArray,
    autoplay,
    moveArray
};
