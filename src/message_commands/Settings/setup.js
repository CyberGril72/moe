const { Message, Permissions, MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const db = require("../../utils/schemas/setup");
const { oops, invalidArgs, msgReply } = require("../../handlers/functions");
const Client = require("../../../index");

module.exports = {
    name: "setup",
    description: "To setup a song request channel.",
    cooldown: 60,
    dev: false,
    usage: "",
    aliases: [],
    category: "Settings",
    examples: ["setup", "setup change #music-requests", "setup clear"],
    sub_commands: ["change <channel_id>", "clear"],
    permissions: {
        client: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.EMBED_LINKS, Permissions.FLAGS.MANAGE_CHANNELS],
        author: [Permissions.FLAGS.ADMINISTRATOR]
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
        try {
            let data = await db.findOne({ _id: message.guildId });
            if (args.length) {
                if (!data) return await oops(message.channel, `This server doesn't have any song request channel setup to use this sub command.`, color);

                if (["change", "set", "changechannel", "cc"].includes(args[0])) {
                    if (!args[1]) return await oops(message.channel, `Please provide or mention a channel or a channel id.`, color);

                    let channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);

                    if (!channel) return await oops(message.channel, `Couldn't find a channel that you've provided in this server.`, color);

                    if (channel.id === data.channel) return await oops(message.channel, `This channel is already in use of the setup, please provide another one.`, color);

                    if (!channel.isText()) return await oops(message.channel, `You've provide an invalid channel, please provide a text channel.`, color);

                    let dataChannel = message.guild.channels.cache.get(channel.id);
                    let m;
                    if (dataChannel) m = await dataChannel.messages.fetch(data.message, { cache: true }).catch(() => { });
                    if (m) await m.delete().catch(() => { });

                    let disabled = true;
                    let player = client.player.get(message.guildId);
                    if (player) disabled = false;

                    const title = player && player.queue && player.queue.current ? `Now playing` : "Nothing is playing right now";
                    const desc = player && player.queue && player.queue.current ? `[**__${player.queue.current.title}__**](${player.queue.current.uri})` : null;
                    const footer = {
                        name: player && player.queue && player.queue.current ? `Requested by ${player.queue.current.requester.username}` : "Thanks for using " + client.user.username,
                        url: player && player.queue && player.queue.current ? `${player.queue.current.requester.displayAvatarURL({ dynamic: true })}` : `${client.user.displayAvatarURL({ dynamic: true })}`
                    };
                    const image = player && player.queue && player.queue.current ? player.queue.current.displayThumbnail("maxresdefault") : client.config.links.image;

                    let embed1 = new MessageEmbed().setColor(color).setTitle(title).setFooter({ text: footer.name, iconURL: footer.url }).setImage(image);

                    if (player && player.queue && player.queue.current) embed1.setDescription(desc);

                    let pausebut = new MessageButton().setCustomId(`pause_but_${message.guildId}`).setEmoji("⏯️").setStyle("SECONDARY").setDisabled(disabled);

                    let lowvolumebut = new MessageButton().setCustomId(`lowvolume_but_${message.guildId}`).setEmoji("🔉").setStyle("SECONDARY").setDisabled(disabled);

                    let highvolumebut = new MessageButton().setCustomId(`highvolume_but_${message.guildId}`).setEmoji("🔊").setStyle("SECONDARY").setDisabled(disabled);

                    let previousbut = new MessageButton().setCustomId(`previous_but_${message.guildId}`).setEmoji("⏮️").setStyle("SECONDARY").setDisabled(disabled);

                    let skipbut = new MessageButton().setCustomId(`skipbut_but_${message.guildId}`).setEmoji("⏭️").setStyle("SECONDARY").setDisabled(disabled);

                    let rewindbut = new MessageButton().setCustomId(`rewindbut_but_${message.guildId}`).setEmoji("⏪").setStyle("SECONDARY").setDisabled(disabled);

                    let forwardbut = new MessageButton().setCustomId(`forward_but_${message.guildId}`).setEmoji("⏩").setStyle("SECONDARY").setDisabled(disabled);

                    let toggleautoplaybut = new MessageButton().setCustomId(`autoplay_but_${message.guildId}`).setEmoji("♾️").setStyle("SECONDARY").setDisabled(disabled);

                    let loopmodesbut = new MessageButton().setCustomId(`loopmodesbut_but_${message.guildId}`).setEmoji("🔁").setStyle("SECONDARY").setDisabled(disabled);

                    let stopbut = new MessageButton().setCustomId(`stop_but_${message.guildId}`).setEmoji("⏹️").setStyle("SECONDARY").setDisabled(disabled);

                    const row1 = new MessageActionRow().addComponents(lowvolumebut, previousbut, pausebut, skipbut, highvolumebut);

                    const row2 = new MessageActionRow().addComponents(rewindbut, toggleautoplaybut, stopbut, loopmodesbut, forwardbut);

                    m = await channel.send({
                        embeds: [embed1],
                        components: [row1, row2]
                    });

                    data.channel = channel.id;
                    data.message = m.id;
                    data.lastUpdated = Math.round(Date.now() / 1000);
                    data.moderator = message.author.id;
                    data.logs.push({
                        userId: message.author.id,
                        userName: message.author.username,
                        updatedOn: Math.round(Date.now() / 1000),
                        mainUpdate: "channel",
                        channelName: channel.name,
                        channelId: channel.id,
                        oldChannelName: dataChannel ? dataChannel.name : null,
                        oldChannelId: dataChannel ? dataChannel.id : null,
                    });

                    await data.save();
                    return await msgReply(message, `Successfully updated setup channel to <#${channel.id}>`, color);
                } else if (["clear", "delete", "reset"].includes(args[0])) {
                    console.log(data);
                    await data.delete();
                    return await msgReply(message, `Successfully deleted all the setup data.`, color);
                } else if (["info", "stats"].includes(args[0])) {
                    const embed003 = client.embed()
                        .setColor(color)
                        .setTitle("Setup Info/Stats")
                        .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
                        .addFields([
                            {
                                name: "Channel",
                                value: `<#${data.channel}> (\`id: ${data.channel}\`)`,
                                inline: false
                            },
                            {
                                name: "Moderator",
                                value: `<@${data.moderator}> (\`id: ${data.moderator}\`)`,
                                inline: false
                            },
                            {
                                name: "Last Updated",
                                value: `<t:${data.lastUpdated}>`,
                                inline: false
                            }
                        ]);

                    return await message.reply({ embeds: [embed003] }).catch(() => { });
                } else return await invalidArgs("setup", message, "Please provide a valid sub command.", client);
            } else {
                if (data) return await oops(message.channel, `Music setup is already finished in this server.`);

                const parentChannel = await message.guild.channels.create(`${client.user.username} Music Zone`, {
                    type: "GUILD_CATEGORY",
                    permissionOverwrites: [
                        {
                            type: "member",
                            id: client.user.id,
                            allow: ["CONNECT", "SPEAK", "VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"],
                            deny: ["USE_APPLICATION_COMMANDS"]
                        },
                        {
                            type: "role",
                            id: message.guild.roles.cache.find((x) => x.name === "@everyone").id,
                            allow: ["VIEW_CHANNEL"],
                            deny: ["USE_APPLICATION_COMMANDS"]
                        }
                    ]
                });

                const textChannel = await message.guild.channels.create(`${client.user.username}-song-requests`, {
                    type: "GUILD_TEXT",
                    parent: parentChannel.id,
                    topic: client.config.setup.channel.topic,
                    permissionOverwrites: [
                        {
                            type: "member",
                            id: client.user.id,
                            allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "READ_MESSAGE_HISTORY"],
                            deny: ["USE_APPLICATION_COMMANDS"]
                        },
                        {
                            type: "role",
                            id: message.guild.roles.cache.find((x) => x.name === "@everyone").id,
                            allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"],
                            deny: ["USE_APPLICATION_COMMANDS"]
                        }
                    ]
                });

                let rates = [1000 * 64, 1000 * 96, 1000 * 128, 1000 * 256, 1000 * 384];
                let rate = rates[0];

                switch (message.guild.premiumTier) {
                    case "NONE":
                        rate = rates[1];
                        break;

                    case "TIER_1":
                        rate = rates[2];
                        break;

                    case "TIER_2":
                        rate = rates[3];
                        break;

                    case "TIER_3":
                        rate = rates[4];
                        break;
                };

                const voiceChannel = await message.guild.channels.create(`${client.user.username} Music`, {
                    type: "GUILD_VOICE",
                    parent: parentChannel.id,
                    bitrate: rate,
                    userLimit: 35,
                    permissionOverwrites: [
                        {
                            type: "member",
                            id: client.user.id,
                            allow: ["CONNECT", "SPEAK", "VIEW_CHANNEL", "REQUEST_TO_SPEAK"]
                        },
                        {
                            type: "role",
                            id: message.guild.roles.cache.find((x) => x.name === "@everyone").id,
                            allow: ["CONNECT", "VIEW_CHANNEL"],
                            deny: ["SPEAK"]
                        }
                    ]
                });

                let disabled = true;
                let player = client.player.get(message.guildId);
                if (player) disabled = false;

                const title = player && player.queue && player.queue.current ? `Now playing` : "Nothing is playing right now";
                const desc = player && player.queue && player.queue.current ? `[**__${player.queue.current.title}__**](${player.queue.current.uri})` : null;
                const footer = {
                    name: player && player.queue && player.queue.current ? `Requested by ${player.queue.current.requester.username}` : "Thanks for using " + client.user.username,
                    url: player && player.queue && player.queue.current ? `${player.queue.current.requester.displayAvatarURL({ dynamic: true })}` : `${client.user.displayAvatarURL({ dynamic: true })}`
                };
                const image = player && player.queue && player.queue.current ? player.queue.current.displayThumbnail("maxresdefault") : client.config.links.image;

                let embed1 = new MessageEmbed().setColor(color).setTitle(title).setFooter({ text: footer.name, iconURL: footer.url }).setImage(image);

                if (player && player.queue && player.queue.current) embed1.setDescription(desc);

                let pausebut = new MessageButton().setCustomId(`pause_but_${message.guildId}`).setEmoji("⏯️").setStyle("SECONDARY").setDisabled(disabled);

                let lowvolumebut = new MessageButton().setCustomId(`lowvolume_but_${message.guildId}`).setEmoji("🔉").setStyle("SECONDARY").setDisabled(disabled);

                let highvolumebut = new MessageButton().setCustomId(`highvolume_but_${message.guildId}`).setEmoji("🔊").setStyle("SECONDARY").setDisabled(disabled);

                let previousbut = new MessageButton().setCustomId(`previous_but_${message.guildId}`).setEmoji("⏮️").setStyle("SECONDARY").setDisabled(disabled);

                let skipbut = new MessageButton().setCustomId(`skipbut_but_${message.guildId}`).setEmoji("⏭️").setStyle("SECONDARY").setDisabled(disabled);

                let rewindbut = new MessageButton().setCustomId(`rewindbut_but_${message.guildId}`).setEmoji("⏪").setStyle("SECONDARY").setDisabled(disabled);

                let forwardbut = new MessageButton().setCustomId(`forward_but_${message.guildId}`).setEmoji("⏩").setStyle("SECONDARY").setDisabled(disabled);

                let toggleautoplaybut = new MessageButton().setCustomId(`autoplay_but_${message.guildId}`).setEmoji("♾️").setStyle("SECONDARY").setDisabled(disabled);

                let loopmodesbut = new MessageButton().setCustomId(`loopmodesbut_but_${message.guildId}`).setEmoji("🔁").setStyle("SECONDARY").setDisabled(disabled);

                let stopbut = new MessageButton().setCustomId(`stop_but_${message.guildId}`).setEmoji("⏹️").setStyle("SECONDARY").setDisabled(disabled);

                const row1 = new MessageActionRow().addComponents(lowvolumebut, previousbut, pausebut, skipbut, highvolumebut);

                const row2 = new MessageActionRow().addComponents(rewindbut, toggleautoplaybut, stopbut, loopmodesbut, forwardbut);

                const msg = await textChannel.send({
                    embeds: [embed1],
                    components: [row1, row2]
                });

                data = new db({
                    _id: message.guildId,
                    channel: textChannel.id,
                    message: msg.id,
                    voiceChannel: voiceChannel.id,
                    moderator: message.author.id,
                    lastUpdated: Math.round(Date.now() / 1000)
                });

                await data.save();
                return await message.channel.send({
                    embeds: [new MessageEmbed().setColor(color).setTitle("Setup Finished").setDescription(`**Song request channel has been created.**\n\nChannel: ${textChannel}\n*You can rename/move this channel if you want to.\n\nNote: Deleting the template embed in there may cause this setup to stop working. (Please don't delete it.)*`).setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })]
                });
            };
        } catch (error) {
            console.error(new Error(error));
        };
    }
}