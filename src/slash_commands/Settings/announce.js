const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const db = require("../../utils/schemas/announce");
const { intReply } = require("../../handlers/functions");

module.exports = {
    data: {
        name: "announce",
        description: "To enable/disable/to set the channel for the now playing message.",
        options: [
            {
                name: "toggle",
                description: "To toggle enable/disable the announcing of track start message.",
                type: "SUB_COMMAND"
            },
            {
                name: "set",
                description: "To set the annouce channel of track start message.",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "channel",
                        description: "The announce channel.",
                        type: "CHANNEL",
                        required: true
                    }
                ]
            },
            {
                name: "reset",
                description: "To reset the announce channel.",
                type: "SUB_COMMAND"
            },
            {
                name: "prunning",
                description: "To toggle enable/disable the prunning of track start message.",
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

        if(!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

        let data = await db.findOne({ _id: interaction.guildId });

        if(interaction.options.getSubcommand() === "set") {
            const channel = interaction.guild.channels.cache.get(interaction.options.getChannel("channel").id);

            if(!channel) return await intReply(interaction, `I was unable to find the given channel.`, color);

            if(channel.type !== "GUILD_TEXT") return await intReply(interaction, `You've provided a invalid channel, please provide a text based channel.`, color);

            if(data) {
                if(data.channel === channel.id) return await intReply(interaction, `This channel is already provided by <@${data.moderator}> on <t:${data.lastUpdated}>`, color);

                data.mode = true;
                data.channel = channel.id;
                data.moderator = interaction.user.id;
                data.lastUpdated = Math.round(Date.now()/1000);
                await data.save();

                return await intReply(interaction, `Announcing of track start message channel has been updated to ${channel}`, color);
            } else {
                data = new db({
                    _id: interaction.guildId,
                    mode: true,
                    channel: channel.id,
                    moderator: interaction.user.id,
                    lastUpdated: Math.round(Date.now()/1000)
                });

                await data.save();
                return await intReply(interaction, `Announcing of track starting message channel has been saved to ${channel}`, color);
            };
        } else if(interaction.options.getSubcommand() === "reset") {
            if(!data) return await intReply(interaction, `No data found for this server to reset.`, color);

            await data.delete();
            return await intReply(interaction, `Announcing of track start message has been reset to default.`, color);
        } else if(interaction.options.getSubcommand() === "prunning") {
            if(data) {
                if(data.prunning) {
                    data.prunning = false;
                    data.moderator = interaction.user.id;
                    data.lastUpdated = Math.round(Date.now()/1000);
                    await data.save();
                    return await intReply(interaction, `Prunning of track start message is now disabled.`, color);
                } else {
                    data.prunning = true;
                    data.moderator = interaction.user.id;
                    data.lastUpdated = Math.round(Date.now()/1000);
                    await data.save();

                    return await intReply(interaction, `Prunning of track start message is now enabled.`, color);
                };
            } else {
                data = new db({
                    _id: interaction.guildId,
                    mode: true,
                    prunning: true,
                    moderator: interaction.user.id,
                    lastUpdated: Math.round(Date.now()/1000)
                });

                await data.save();
                return await intReply(interaction, `Prunning of track start message is now enabled.`, color);
            };
        } else {
            if(data) {
                if(data.mode === true) {

                    data.mode = false;
                    data.lastUpdated = Math.round(Date.now()/1000);
                    data.moderator = interaction.user.id;
                    await data.save();

                    return await intReply(interaction, `Announcing of track start message is now disabled.`, color);
                } else {
                    data.mode = true;
                    data.lastUpdated = Math.round(Date.now()/1000);
                    data.moderator = interaction.user.id;
                    await data.save();

                    return await intReply(interaction, `Announcing of track start message is now enabled.`, color);
                };
            } else {
                data = new db({
                    _id: interaction.guildId,
                    mode: true,
                    moderator: interaction.user.id,
                    lastUpdated: Math.round(Date.now()/1000)
                });

                await data.save();
                return await intReply(interaction, `Announcing of track start message is now enabled.`, color);
            };
        }
    }
}
