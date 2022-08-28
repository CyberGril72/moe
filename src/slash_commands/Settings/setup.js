const { CommandInteraction, Permissions, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const Client = require("../../../index");
const { intReply } = require("../../handlers/functions");
const db = require("../../utils/schemas/setup");

module.exports = {
    data: {
        name: "setup",
        description: "To set the song request channel.",
        options: [
            {
                name: "configure",
                description: "To start the configuration of song request channel.",
                type: "SUB_COMMAND"
            },
            {
                name: "change",
                description: "To change the song request channel.",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "channel",
                        description: "The channel that you want to change.",
                        type: "CHANNEL",
                        required: true
                    }
                ]
            },
            {
                name: "delete",
                description: "To delete the song request channel setup.",
                type: "SUB_COMMAND"
            },
            {
                name: "info",
                description: "To get info about the song request channel.",
                type: "SUB_COMMAND"
            }
        ]
    },

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {String} color 
     */

    execute: async (client, interaction, color) => {
        if(!interaction.replied) await interaction.deferReply().catch(() => {});
        if(!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

        let data = await db.findOne({ _id: interaction.guildId });
        if(interaction.options.getSubcommand() === "configure") {
            if(data) return await intReply(interaction, `Song request channel setup is already finished for this server.`, color);

            if(!interaction.guild.me.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) return await intReply(interaction, `I don't have enough permission to execute this command.`, color);

            const parent = await interaction.guild.channels.create(`${client.user.username} Music Zone`, {
                type: "GUILD_CATEGORY",
                permissionOverwrites: [
                    {
                        type: "member",
                        id: client.user.id,
                        allow: ["CONNECT", "SPEAK", "VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"]
                    },
                    {
                        type: "role",
                        id: interaction.guild.roles.cache.find((x) => x.name === "@everyone").id,
                        allow: ["VIEW_CHANNEL"]
                    }
                ]
            });

            const textChannel = await interaction.guild.channels.create(`${client.user.username}-song-requests`, {
                type: "GUILD_TEXT", 
                parent: parent.id , 
                topic: client.config.setup.channel.topic,
                permissionOverwrites: [
                    {
                        type: "member",
                        id: client.user.id,
                        allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "READ_MESSAGE_HISTORY"]
                    },
                    {
                        type: "role",
                        id: interaction.guild.roles.cache.find((x) => x.name === "@everyone").id,
                        allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"]
                    }
                ]
            });

            let rates = [1000*64, 1000*96, 1000*128, 1000*256, 1000*384];
            let rate = rates[0];

            switch(interaction.guild.premiumTier) {
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

            const voiceChannel = await interaction.guild.channels.create(`${client.user.username} Music`, {
                type: "GUILD_VOICE",
                parent: parent.id,
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
                        id: interaction.guild.roles.cache.find((x) => x.name === "@everyone").id,
                        allow: ["CONNECT", "VIEW_CHANNEL"],
                        deny: ["SPEAK"]
                    }
                ]
            });

            let disabled = true;
            let player = client.player.get(interaction.guildId);
            if(player) disabled = false;

            const title = player && player.queue && player.queue.current ? `Now playing` : "Nothing is playing right now";
            const desc = player && player.queue && player.queue.current ? `[**__${player.queue.current.title}__**](${player.queue.current.uri})` : null;
            const footer = {
                name: player && player.queue && player.queue.current ? `Requested by ${player.queue.current.requester.username}` : "Thanks for using "+client.user.username,
                url: player && player.queue && player.queue.current ? `${player.queue.current.requester.displayAvatarURL({ dynamic: true })}` : `${client.user.displayAvatarURL({ dynamic: true })}`
            };
            const image = player && player.queue && player.queue.current ? player.queue.current.displayThumbnail("maxresdefault") : client.config.links.image;

            let embed1 = new MessageEmbed().setColor(color).setTitle(title).setFooter({text: footer.name,iconURL: ifooter.url}).setImage(image);

            if(player && player.queue && player.queue.current) embed1.setDescription(desc);

            let pausebut = new MessageButton().setCustomId(`pause_but_${interaction.guildId}`).setEmoji("⏯️").setStyle("SECONDARY").setDisabled(disabled);

            let lowvolumebut = new MessageButton().setCustomId(`lowvolume_but_${interaction.guildId}`).setEmoji("🔉").setStyle("SECONDARY").setDisabled(disabled);

            let highvolumebut = new MessageButton().setCustomId(`highvolume_but_${interaction.guildId}`).setEmoji("🔊").setStyle("SECONDARY").setDisabled(disabled);

            let previousbut = new MessageButton().setCustomId(`previous_but_${interaction.guildId}`).setEmoji("⏮️").setStyle("SECONDARY").setDisabled(disabled);

            let skipbut = new MessageButton().setCustomId(`skipbut_but_${interaction.guildId}`).setEmoji("⏭️").setStyle("SECONDARY").setDisabled(disabled);

            let rewindbut = new MessageButton().setCustomId(`rewindbut_but_${interaction.guildId}`).setEmoji("⏪").setStyle("SECONDARY").setDisabled(disabled);

            let forwardbut = new MessageButton().setCustomId(`forward_but_${interaction.guildId}`).setEmoji("⏩").setStyle("SECONDARY").setDisabled(disabled);

            let toggleautoplaybut = new MessageButton().setCustomId(`autoplay_but_${interaction.guildId}`).setEmoji("♾️").setStyle("SECONDARY").setDisabled(disabled);

            let loopmodesbut = new MessageButton().setCustomId(`loopmodesbut_but_${interaction.guildId}`).setEmoji("🔁").setStyle("SECONDARY").setDisabled(disabled);

            let stopbut = new MessageButton().setCustomId(`stop_but_${interaction.guildId}`).setEmoji("⏹️").setStyle("SECONDARY").setDisabled(disabled);

            const row1 = new MessageActionRow().addComponents(lowvolumebut, previousbut, pausebut, skipbut, highvolumebut);

            const row2 = new MessageActionRow().addComponents(rewindbut, toggleautoplaybut, stopbut, loopmodesbut, forwardbut);

            const msg = await textChannel.send({
                embeds: [embed1],
                components: [row1, row2]
            });

            data = new db({
                _id: interaction.guildId,
                channel: textChannel.id,
                message: msg.id,
                voiceChannel: voiceChannel.id,
                moderator: interaction.user.id,
                lastUpdated: Math.round(Date.now()/1000)
            });

            await data.save();
            return await interaction.editReply({ embeds: [new MessageEmbed().setColor(color).setTitle("Setup Finished").setDescription(`**Song request channel has been created.**\n\nChannel: ${textChannel}\n*You can rename/move this channel if you want to.\n\nNote: Deleting the template embed in there may cause this setup to stop working. (Please don't delete it.)*`).setAuthor({name: interaction.user.tag,iconURL: interaction.user.displayAvatarURL({ dynamic: true })})] }).catch(() => {});
        } else if(interaction.options.getSubcommand() === "change") {
            const channel = interaction.guild.channels.cache.get(interaction.options.getChannel("channel").id);
            if(!channel) return await intReply(interaction, `Couldn't find the given channel.`, color);
            if(channel.id === data.channel) return await intReply(interaction, `This channel is already in use of the setup, please provide another one.`, color);

            if(!channel.isText()) return await intReply(interaction, `You've provide an invalid channel, please provide a text channel.`, color);

            let dataChannel = interaction.guild.channels.cache.get(channel.id);
            let m;

            try {
                if(dataChannel) m = await dataChannel.messages.fetch(data.message, { cache: true });
            } catch (e) {};

            if(m) await m.delete().catch(() => {});

            let disabled = true;
            let player = client.player.get(interaction.guildId);
            if(player) disabled = false;

            const title = player && player.queue && player.queue.current ? `Now playing` : "Nothing is playing right now";
            const desc = player && player.queue && player.queue.current ? `[**__${player.queue.current.title}__**](${player.queue.current.uri})` : null;
            const footer = {
                name: player && player.queue && player.queue.current ? `Requested by ${player.queue.current.requester.username}` : "Thanks for using "+client.user.username,
                url: player && player.queue && player.queue.current ? `${player.queue.current.requester.displayAvatarURL({ dynamic: true })}` : `${client.user.displayAvatarURL({ dynamic: true })}`
            };
            const image = player && player.queue && player.queue.current ? player.queue.current.displayThumbnail("maxresdefault") : client.config.links.image;

            let embed1 = new MessageEmbed().setColor(color).setTitle(title).setFooter({text: footer.name,iconURL: footer.url}).setImage(image);

            if(player && player.queue && player.queue.current) embed1.setDescription(desc);

            let pausebut = new MessageButton().setCustomId(`pause_but_${interaction.guildId}`).setEmoji("⏯️").setStyle("SECONDARY").setDisabled(disabled);

            let lowvolumebut = new MessageButton().setCustomId(`lowvolume_but_${interaction.guildId}`).setEmoji("🔉").setStyle("SECONDARY").setDisabled(disabled);

            let highvolumebut = new MessageButton().setCustomId(`highvolume_but_${interaction.guildId}`).setEmoji("🔊").setStyle("SECONDARY").setDisabled(disabled);

            let previousbut = new MessageButton().setCustomId(`previous_but_${interaction.guildId}`).setEmoji("⏮️").setStyle("SECONDARY").setDisabled(disabled);

            let skipbut = new MessageButton().setCustomId(`skipbut_but_${interaction.guildId}`).setEmoji("⏭️").setStyle("SECONDARY").setDisabled(disabled);

            let rewindbut = new MessageButton().setCustomId(`rewindbut_but_${interaction.guildId}`).setEmoji("⏪").setStyle("SECONDARY").setDisabled(disabled);

            let forwardbut = new MessageButton().setCustomId(`forward_but_${interaction.guildId}`).setEmoji("⏩").setStyle("SECONDARY").setDisabled(disabled);

            let toggleautoplaybut = new MessageButton().setCustomId(`autoplay_but_${interaction.guildId}`).setEmoji("♾️").setStyle("SECONDARY").setDisabled(disabled);

            let loopmodesbut = new MessageButton().setCustomId(`loopmodesbut_but_${interaction.guildId}`).setEmoji("🔁").setStyle("SECONDARY").setDisabled(disabled);

            let stopbut = new MessageButton().setCustomId(`stop_but_${interaction.guildId}`).setEmoji("⏹️").setStyle("SECONDARY").setDisabled(disabled);

            const row1 = new MessageActionRow().addComponents(lowvolumebut, previousbut, pausebut, skipbut, highvolumebut);

            const row2 = new MessageActionRow().addComponents(rewindbut, toggleautoplaybut, stopbut, loopmodesbut, forwardbut);

            m = await channel.send({
                embeds: [embed1],
                components: [row1, row2]
            });

            data.channel = channel.id;
            data.message = m.id;
            data.lastUpdated = Math.round(Date.now()/1000);
            data.moderator = interaction.user.id;
            data.logs.push({
                userId: interaction.user.id,
                userName: interaction.user.username,
                updatedOn: Math.round(Date.now()/1000),
                mainUpdate: "channel",
                channelName: channel.name,
                channelId: channel.id,
                oldChannelName: dataChannel ? dataChannel.name : null,
                oldChannelId: dataChannel ? dataChannel.id : null, 
            });

            await data.save();
            return await intReply(interaction, `Successfully updated setup channel to <#${channel.id}>`, color);
        } else if(interaction.options.getSubcommand() === "info") {
            if(!data) return await intReply(interaction, `This server doesn't have done any setup configuration yet to use this command.`, color);

            const embed003 = client.embed()
            .setColor(color)
            .setTitle("Setup Info/Stats")
            .setAuthor({name: interaction.guild.name,iconURL: interaction.guild.iconURL({ dynamic: true })})
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

            return await interaction.editReply({ embeds: [embed003] }).catch(() => {});
        } else if(interaction.options.getSubcommand() === "delete") {
            if(!data) return await intReply(interaction, `This server doesn't have done any setup configuration yet to use this command.`, color);

            await data.delete();
            return await intReply(interaction, `Successfully deleted the server setup data.`, color);
        } else return await intReply(interaction, `You've choosen an invalid sub command.`, color);
    }
}