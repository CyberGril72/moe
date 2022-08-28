const Client = require("../../../index");
const { CommandInteraction, Permissions, MessageEmbed } = require("discord.js");
const { intReply } = require("../../handlers/functions");
const db = require("../../utils/schemas/prefix");

module.exports = {
    data: {
        name: "prefix",
        description: "To set/change/reset the custom prefix of the server.",
        options: [
            {
                name: "set",
                description: "To set the custom prefix.",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "symbol",
                        description: "The custom prefix (symbol).",
                        type: "STRING",
                        required: true
                    }
                ]
            },

            {
                name: "reset",
                description: "To reset the custom prefix to old prefix.",
                type: "SUB_COMMAND"
            },

            {
                name: "clear",
                description: "To clear the custom prefix data.",
                type: "SUB_COMMAND"
            },

            {
                name: "info",
                description: "To get the information about the custom prefix data.",
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
        let data = await db.findOne({ _id: interaction.guildId });

        if(interaction.options.getSubcommand() === "set") {
            if(!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return await intReply(interaction, `You don't have enough permission to use this command.`, color);
            let prefix = interaction.options.getString("symbol");
            if(!prefix) return await intReply(interaction, `Please provide a prefix (symbol).`, color);
            if(prefix.length > 3) return await intReply(interaction, `Prefix (symbol) cannot be more than 3 characters.`, color);

            if(!data) {
                data = new db({
                    _id: interaction.guildId,
                    prefix: prefix,
                    oldPrefix: client.config.prefix,
                    moderator: interaction.user.id,
                    lastUpdated: Math.round(Date.now()/1000)
                });

                await data.save();
                return await intReply(interaction, `Successfully saved server prefix as \`[ ${prefix} ]\``, color);
            } else {
                if(prefix === data.prefix) return await intReply(interaction, `This prefix is already provided by <@${data.moderator}> <t:${data.lastUpdated}>`, color);

                data.oldPrefix = data.prefix;
                data.prefix = prefix;
                data.moderator = interaction.user.id;
                data.lastUpdated = Math.round(Date.now()/1000);

                await data.save();
                return await intReply(interaction, `Successfully updated server prefix as \`[ ${prefix} ]\``, color);
            };
        } else if(interaction.options.getSubcommand() === "reset") {
            if(!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return await intReply(interaction, `You don't have enough permission to use this command.`, color);
            if(!data) return await intReply(interaction, `No data found for this server to reset.`, color);

            data.prefix = data.oldPrefix;
            data.oldPrefix = data.prefix;
            data.moderator = interaction.user.id;
            data.lastUpdated = Math.round(Date.now()/1000);

            await data.save();
            return await intReply(interaction, `Successfully reset server prefix to \`[ ${data.prefix} ]\``);
        } else if(interaction.options.getSubcommand() === "clear") {
            if(!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

            if(!data) return await intReply(interaction, `No data found for this server to clear.`, color);
            await db.findOneAndDelete({ _id: interaction.guildId });
            return await intReply(interaction, `Successfully clear server prefix data and reset to \`[ ${client.config.prefix} ]\``, color);
        } else if(interaction.options.getSubcommand() === "info") {
            if(!data) {
                return await intReply(interaction, `Current Server Prefix: \`[ ${client.config.prefix} ]\``, color);
            } else {
                const embed1 = new MessageEmbed().setColor(color).setAuthor({name: interaction.guild.name,iconURL: interaction.guild.iconURL({ dynamic: true })}).setTitle(`Prefix Information`).setFooter({text: `Requested by ${interaction.user.username}`,iconURL: interaction.user.displayAvatarURL({ dynamic: true })}).addFields([
                    { name: "Prefix", value: `\`[ ${data.prefix} ]\``, inline: true },
                    { name: "Old Prefix", value: `\`[ ${data.oldPrefix} ]\``, inline: true },
                    { name: "Moderator", value: `<@${data.moderator}> (\`id: ${data.moderator}\`)`, inline: true },
                    { name: "Last Updated", value: `<t:${data.lastUpdated}>`, inline: true }
                ]).setTimestamp();
    
                return await interaction.editReply({ embeds: [embed1] }).catch(() => {});
            };
        };
    }
}