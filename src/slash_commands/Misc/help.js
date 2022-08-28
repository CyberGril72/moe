const { CommandInteraction, MessageActionRow, MessageButton } = require("discord.js");
const Client = require("../../../index");
const { intReply, getPrefix } = require("../../handlers/functions");
const commandCmd = require("./commands");
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    data: {
        name: "help",
        description: "Stop it, get some help.",
        options: [
            {
                name: "input",
                description: "The input which you need help for.",
                type: "STRING",
                required: false
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
        const input = interaction.options.getString("input");
        const prefix = "/";
        const msg_prefix = await getPrefix(interaction.guildId, client);

        if(input) {
            let categoryName, cmds;
            if(["command", "commands", "cmd", "cmds"].includes(input)) {
                return await commandCmd.execute(client, interaction, color);
            } else if(["music"].includes(input)) {
                categoryName = "Music";
                cmds = client.commands.filter((x) => x.category && x.category === categoryName).map((x) => `\`${x.name}\``);

                return await interaction.editReply({ embeds: [client.embed().setColor(color).setTitle(`${categoryName} Commands`).setDescription(cmds.join(", ")).setFooter({text: `Total ${cmds.length} ${categoryName.toLowerCase()} slash commands.`})] }).catch(() => {});
            } else if(["filters"].includes(input)) {
                categoryName = "Filters";
                cmds = client.commands.filter((x) => x.category && x.category === categoryName).map((x) => `\`${x.name}\``);

                return await interaction.editReply({ embeds: [client.embed().setColor(color).setTitle(`${categoryName} Commands`).setDescription(cmds.join(", ")).setFooter({text: `Total ${cmds.length} ${categoryName.toLowerCase()} slash commands.`})] }).catch(() => {});
            } else if(["settings", "config"].includes(input)) {
                categoryName = "Settings";
                cmds = client.commands.filter((x) => x.category && x.category === categoryName).map((x) => `\`${x.name}\``);

                return await interaction.editReply({ embeds: [client.embed().setColor(color).setTitle(`${categoryName} Commands`).setDescription(cmds.join(", ")).setFooter({text: `Total ${cmds.length} ${categoryName.toLowerCase()} slash commands.`})] }).catch(() => {});
            } else if(["misc"].includes(input)) {
                categoryName = "Music";
                cmds = client.commands.filter((x) => x.category && x.category === categoryName).map((x) => `\`${x.name}\``);

                return await interaction.editReply({ embeds: [client.embed().setColor(color).setTitle(`${categoryName} Commands`).setDescription(cmds.join(", ")).setFooter({text: `Total ${cmds.length} ${categoryName.toLowerCase()} slash commands.`})] }).catch(() => {});
            } else {
                const command = client.commands.get(input) || client.commands.get(client.aliases.get(input));
                if(!command) return await intReply(interaction, `Couldn't find any command named "${input}"`, color);

                let commandExamples = [];
                if(Array.isArray(command.examples)) for (let i of command.examples) commandExamples.push(`${prefix}${i}`);

                let commandSubcommands = [];
                if(Array.isArray(command.sub_commands)) for (i of command.sub_commands) commandSubcommands.push(`${prefix}${command.name} ${i}`);

                const fieldData = [
                    {
                        name: "Usage",
                        value: `${command.usage ? `\`${prefix}${command.name} ${command.usage}\``: `\`${prefix}${command.name}\``}`,
                        inline: false
                    },

                    {
                        name: "Cooldown",
                        value: `${command.cooldown ? `\`[ ${prettyMilliseconds(1000*command.cooldown)} ]\``: "`[ 3s ]`"}`,
                        inline: false
                    },

                    {
                        name: "Category",
                        value: `${command.category ? command.category : "None"}`,
                        inline: false
                    }
                ];

                if(commandSubcommands.length > 0) fieldData.push({
                    name: "Sub command(s)",
                    value: `${commandSubcommands.map((x) => `\`${x}\``).join("\n")}`,
                    inline: false
                });

                if(commandExamples.length > 0) fieldData.push({
                    name: "Example(s)",
                    value: `${commandExamples.map((x) => `\`${x}\``).join("\n")}`,
                    inline: false
                });

                const embed1 = client.embed().setColor(color).setDescription(`${command.description}`).setTitle(`__${command.name}__ Command Help`).setFooter({text: `Note: These are the info from message command, in slash commands it might be different.`}).addFields(fieldData).setAuthor({name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true })});

                return await interaction.editReply({ embeds: [embed1] }).catch(() => {});
            };
        } else {
            const embed1 = client.embed().setColor(color).setDescription(`Hey there <@${interaction.user.id}>, your help has arrived!\nI'm a discord music bot with some awesome features that's gonna explode your mind and my prefix for this server is \`${msg_prefix}\`\nSo let's get started,\n\nTo see all my message commands do \`${msg_prefix}commands\`\nTo see all my slash commands do \`${prefix}commands\`.\n\nDo you wanna make your server more active and chill with some music?\nThen just do \`${prefix}setup configure\` to make your server more cool.\n\nOr do you want a new prefix or change the current prefix?\nThen just do \`${prefix}prefix set <symbol>\`\n\nIts not over yet, there is more. Check it all out now!`).setAuthor({name: interaction.user.tag,iconURL: interaction.user.displayAvatarURL({ dynamic: true })}).setTitle(`${client.user.username} Help`).setThumbnail(client.user.displayAvatarURL());

            let music = new MessageButton().setCustomId("help_cmd_music_commands").setLabel("Music").setStyle("SECONDARY");

            let filters = new MessageButton().setCustomId("help_cmd_filters_commands").setLabel("Filters").setStyle("SECONDARY");

            let settings = new MessageButton().setCustomId("help_cmd_settings_commands").setLabel("Settings").setStyle("SECONDARY");

            let misc = new MessageButton().setCustomId("help_cmd_misc_commands").setStyle("SECONDARY").setLabel("Misc");

            let homebut = new MessageButton().setCustomId("help_cmd_home_but").setStyle("PRIMARY").setLabel("Home");

            await interaction.editReply({ embeds: [embed1], components: [new MessageActionRow().addComponents(homebut.setDisabled(true), music, filters, settings, misc)] }).catch(() => {});

            const collector = interaction.channel.createMessageComponentCollector({
                filter: (b) => {
                    if(b.user.id === interaction.user.id) return true;
                    else {
                        b.deferUpdate().catch(() => {});
                        return false;
                    }
                },
                time: 60000,
                idle: 60000/2
            });

            const editEmbed = client.embed();
            let _commands;

            collector.on("end", async () => {
                await interaction.editReply({ components: [new MessageActionRow().addComponents(homebut.setDisabled(true), music.setDisabled(true), filters.setDisabled(true), settings.setDisabled(true), misc.setDisabled(true))] }).catch(() => {});
            });

            collector.on("collect", async (button) => {
                if(!button.deferred) await button.deferUpdate().catch(() => {});

                if(button.customId === music.customId) {
                    _commands = client.commands.filter((x) => x.category && x.category === "Music").map((x) => `\`${x.name}\``);

                    editEmbed.setColor(color).setDescription(_commands.join(", ")).setTitle("Music Commands").setFooter({text: `Total ${_commands.length} music commands.`});

                    music.setDisabled(true);
                    homebut.setDisabled(false);
                    filters.setDisabled(false);
                    settings.setDisabled(false);
                    misc.setDisabled(false);

                    return await interaction.editReply({ embeds: [editEmbed], components: [new MessageActionRow().addComponents(homebut, music, filters, settings, misc)] }).catch(() => {});
                } else if(button.customId === filters.customId) {
                    _commands = client.commands.filter((x) => x.category && x.category === "Filters").map((x) => `\`${x.name}\``);

                    editEmbed.setColor(color).setDescription(_commands.join(", ")).setTitle("Filter Commands").setFooter({text: `Total ${_commands.length} filter commands.`});

                    music.setDisabled(false);
                    homebut.setDisabled(false);
                    filters.setDisabled(true);
                    settings.setDisabled(false);
                    misc.setDisabled(false);

                    return await interaction.editReply({ embeds: [editEmbed], components: [new MessageActionRow().addComponents(homebut, music, filters, settings, misc)] }).catch(() => {});
                } else if(button.customId === homebut.customId) {

                    music.setDisabled(false);
                    homebut.setDisabled(true);
                    filters.setDisabled(false);
                    settings.setDisabled(false);
                    misc.setDisabled(false);

                    return await interaction.editReply({ embeds: [embed1], components: [new MessageActionRow().addComponents(homebut, music, filters, settings, misc)] }).catch(() => {});
                } else if(button.customId === misc.customId) {
                    _commands = client.commands.filter((x) => x.category && x.category === "Misc").map((x) => `\`${x.name}\``);

                    editEmbed.setColor(color).setDescription(_commands.join(", ")).setTitle("Misc Commands").setFooter({text: `Total ${_commands.length} misc commands.`});

                    music.setDisabled(false);
                    homebut.setDisabled(false);
                    filters.setDisabled(false);
                    settings.setDisabled(false);
                    misc.setDisabled(true);

                    return await interaction.editReply({ embeds: [editEmbed], components: [new MessageActionRow().addComponents(homebut, music, filters, settings, misc)] }).catch(() => {});
                } else if(button.customId === settings.customId) {
                    _commands = client.commands.filter((x) => x.category && x.category === "Settings").map((x) => `\`${x.name}\``);

                    editEmbed.setColor(color).setDescription(_commands.join(", ")).setTitle("Settings Commands").setFooter({text: `Total ${_commands.length} settings commands.`});

                    music.setDisabled(false);
                    homebut.setDisabled(false);
                    filters.setDisabled(false);
                    settings.setDisabled(true);
                    misc.setDisabled(false);

                    return await interaction.editReply({ embeds: [editEmbed], components: [new MessageActionRow().addComponents(homebut, music, filters, settings, misc)] }).catch(() => {});
                } else return;
            });
        };
    }
}
