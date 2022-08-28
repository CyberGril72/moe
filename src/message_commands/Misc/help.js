const { Message, Permissions, MessageButton, MessageActionRow } = require("discord.js");
const prettyMilliseconds = require("pretty-ms");
const Client = require("../../../index");
const { oops } = require("../../handlers/functions")
const { execute } = require("./commands");

module.exports = {
    name: "help",
    description: "Gets help for you.",
    cooldown: 3,
    dev: false,
    usage: "[command_name]",
    aliases: [],
    category: "Misc",
    examples: ["help", "help play", "help p"],
    sub_commands: [],
    args: false,
    player: { active: false, voice: false, dj: false, djPerm: null },
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
        if (args.length) {
            let name, c;

            if (["commands", "cmds", "c"].includes(args[0])) {
                return await execute(client, message, args, prefix, color);
            } else if (["music"].includes(args[0])) {
                name = "Music";
                c = client.commands.filter((x) => x.category && x.category === name).map((x) => `\`${x.name}\``);

                return await message.reply({ embeds: [client.embed().setColor(color).setTitle(`${name} Commands`).setDescription(c.join(", ")).setFooter({ text: `Total ${c.length} ${name.toLowerCase()} commands.` })] }).catch(() => { });
            } else if (["filters"].includes(args[0])) {
                name = "Filters";
                c = client.commands.filter((x) => x.category && x.category === name).map((x) => `\`${x.name}\``);

                return await message.reply({ embeds: [client.embed().setColor(color).setTitle(`${name} Commands`).setDescription(c.join(", ")).setFooter({ text: `Total ${c.length} ${name.toLowerCase()} commands.` })] }).catch(() => { });
            } else if (["settings", "config"].includes(args[0])) {
                name = "Settings";
                c = client.commands.filter((x) => x.category && x.category === name).map((x) => `\`${x.name}\``);

                return await message.reply({ embeds: [client.embed().setColor(color).setTitle(`${name} Commands`).setDescription(c.join(", ")).setFooter({ text: `Total ${c.length} ${name.toLowerCase()} commands.` })] }).catch(() => { });
            } else if (["misc"].includes(args[0])) {
                name = "Misc";
                c = client.commands.filter((x) => x.category && x.category === name).map((x) => `\`${x.name}\``);

                return await message.reply({ embeds: [client.embed().setColor(color).setTitle(`${name} Commands`).setDescription(c.join(", ")).setFooter({ text: `Total ${c.length} ${name.toLowerCase()} commands.` })] }).catch(() => { });
            } else {
                const command = client.commands.get(args[0]) || client.commands.get(client.aliases.get(args[0]));
                if (!command) return await oops(message.channel, `Cannot find the command called "${args[0]}"`, color);

                let commandAliases = [];
                if (Array.isArray(command.aliases)) for (let i of command.aliases) commandAliases.push(`${prefix}${i}`);

                let commandExamples = [];
                if (Array.isArray(command.examples)) for (let i of command.examples) commandExamples.push(`${prefix}${i}`);

                let commandSubcommands = [];
                if (Array.isArray(command.sub_commands)) for (i of command.sub_commands) commandSubcommands.push(`${prefix}${command.name} ${i}`);

                const fieldData = [
                    {
                        name: "Usage",
                        value: `${command.usage ? `\`${prefix}${command.name} ${command.usage}\`` : `\`${prefix}${command.name}\``}`,
                        inline: false
                    },

                    {
                        name: "Cooldown",
                        value: `${command.cooldown ? `\`[ ${prettyMilliseconds(1000 * command.cooldown)} ]\`` : "`[ 3s ]`"}`,
                        inline: false
                    },

                    {
                        name: "Category",
                        value: `${command.category ? command.category : "None"}`,
                        inline: false
                    }
                ];

                if (commandAliases.length > 0) fieldData.push({
                    name: "Aliases",
                    value: `${commandAliases.map((x) => `\`${x}\``).join(", ")}`,
                    inline: false
                });

                if (commandSubcommands.length > 0 && commandSubcommands.length < 5) fieldData.push({
                    name: "Sub command(s)",
                    value: `${commandSubcommands.map((x) => `\`${x}\``).join("\n")}`,
                    inline: false
                });

                if (commandExamples.length > 0 && commandExamples.length < 5) fieldData.push({
                    name: "Example(s)",
                    value: `${commandExamples.map((x) => `\`${x}\``).join("\n")}`,
                    inline: false
                });

                if (commandSubcommands.length >= 5 || commandExamples.length >= 5) {
                    for (let i of fieldData) i.inline = true;

                    const embed1 = client.embed().setColor(color).setDescription(command.description).setTitle(`__${command.name}__ Command Help`).setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).addFields(fieldData);

                    const fieldData2 = [];
                    if (commandSubcommands.length > 0) fieldData2.push({
                        name: "Sub command(s)",
                        value: `${commandSubcommands.map((x) => `\`${x}\``).join("\n")}`,
                        inline: true
                    });

                    if (commandExamples.length > 0) fieldData2.push({
                        name: "Example(s)",
                        value: `${commandExamples.map((x) => `\`${x}\``).join("\n")}`,
                        inline: true
                    });

                    const embed2 = client.embed().setColor(color).setDescription(command.description).setTitle(`__${command.name}__ Command Help`).setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).addFields(fieldData2);

                    const pages = [embed1, embed2];
                    let page = 0;

                    embed2.setFooter({ text: `Page ${page + 1} of ${pages.length}` });
                    embed1.setFooter({ text: `Page ${page + 1} of ${pages.length}` });

                    const previousbut = client.button().setCustomId(`previous_but_help_cmd`).setEmoji(client.config.emojis.previous).setStyle("SECONDARY");

                    const nextbut = client.button().setCustomId(`next_but_help_cmd`).setEmoji(client.config.emojis.next).setStyle("SECONDARY");

                    const m = await message.reply({ embeds: [pages[page]], components: [new MessageActionRow().addComponents(previousbut, nextbut)] });

                    const collector = m.createMessageComponentCollector({
                        filter: (b) => b.user.id === message.author.id ? true : false && b.deferUpdate().catch(() => { }),
                        time: 60000 * 2,
                        idle: 60000
                    });

                    collector.on("end", async () => {
                        if (!m) return;
                        await m.edit({ components: [new MessageActionRow().addComponents(previousbut.setDisabled(true), nextbut.setDisabled(true))] }).catch(() => { });
                    });

                    collector.on("collect", async (button) => {
                        if (!button.deferred) await button.deferUpdate().catch(() => { });
                        if (button.customId === previousbut.customId) {
                            page = page - 1 < 0 ? pages.length - 1 : --page;
                            if (!m) return;

                            pages[page].setFooter({ text: `Page ${page + 1} of ${pages.length}` });
                            return await m.edit({ embeds: [pages[page]] }).catch(() => { });
                        } else if (button.customId === nextbut.customId) {
                            page = page + 1 >= pages.length ? 0 : ++page;
                            if (!m) return;

                            pages[page].setFooter({ text: `Page ${page + 1} of ${pages.length}` });
                            return await m.edit({ embeds: [pages[page]] }).catch(() => { });
                        } else return;
                    });
                } else {
                    const embed2 = client.embed().setColor(color).setDescription(command.description).setTitle(`__${command.name}__ Command Help`).setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).addFields(fieldData);

                    return await message.reply({ embeds: [embed2] }).catch(() => { });
                };
            };
        } else {
            const embed1 = client.embed().setColor(color).setDescription(`Hey there <@${message.author.id}>, your help has arrived!\nI'm a discord music bot with some awesome features that's gonna explode your mind and my prefix for this server is \`${prefix}\`\nSo let's get started,\n\nTo see all my message commands do \`${prefix}commands\`\nTo see all my slash commands do \`/commands\`.\n\nDo you wanna make your server more active and chill with some music?\nThen just do \`${prefix}setup\` to make your server more cool.\n\nOr do you want a new prefix or change the current prefix?\nThen just do \`${prefix}prefix set <symbol>\`\n\nIts not over yet, there is more. Check it all out.`).setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setTitle(`${client.user.username} Help`).setThumbnail(client.user.displayAvatarURL());

            let music = new MessageButton().setCustomId("help_cmd_music_commands").setLabel("Music").setStyle("SECONDARY");

            let filters = new MessageButton().setCustomId("help_cmd_filters_commands").setLabel("Filters").setStyle("SECONDARY");

            let settings = new MessageButton().setCustomId("help_cmd_settings_commands").setLabel("Settings").setStyle("SECONDARY");

            let misc = new MessageButton().setCustomId("help_cmd_misc_commands").setStyle("SECONDARY").setLabel("Misc");

            let homebut = new MessageButton().setCustomId("help_cmd_home_but").setStyle("PRIMARY").setLabel("Home");

            const m = await message.reply({ embeds: [embed1], components: [new MessageActionRow().addComponents(homebut.setDisabled(true), music, filters, misc, settings)] });

            const collector = m.createMessageComponentCollector({
                filter: (b) => {
                    if (b.user.id === message.author.id) return true;
                    else {
                        b.deferUpdate().catch(() => { });
                        return false;
                    };
                },
                time: 60000 * 2,
                idle: 60000
            });

            let _commands;
            let editEmbed = client.embed();

            collector.on("end", async () => {
                if (!m) return;
                await m.edit({ components: [new MessageActionRow().addComponents(homebut.setDisabled(true), music.setDisabled(true), filters.setDisabled(true), settings.setDisabled(true), misc.setDisabled(true))] }).catch(() => { });
            });

            collector.on("collect", async (button) => {
                if (!button.deferred) await button.deferUpdate().catch(() => { });

                if (button.customId === music.customId) {
                    _commands = client.commands.filter((x) => x.category && x.category === "Music").map((x) => `\`${x.name}\``);

                    editEmbed.setColor(color).setDescription(_commands.join(", ")).setTitle("Music Commands").setFooter({ text: `Total ${_commands.length} music commands.` });

                    if (!m) return;

                    music.setDisabled(true);
                    homebut.setDisabled(false);
                    filters.setDisabled(false);
                    settings.setDisabled(false);
                    misc.setDisabled(false);

                    return await m.edit({ embeds: [editEmbed], components: [new MessageActionRow().addComponents(homebut, music, filters, settings, misc)] }).catch(() => { });
                } else if (button.customId === filters.customId) {
                    _commands = client.commands.filter((x) => x.category && x.category === "Filters").map((x) => `\`${x.name}\``);

                    editEmbed.setColor(color).setDescription(_commands.join(", ")).setTitle("Filter Commands").setFooter({ text: `Total ${_commands.length} filter commands.` });

                    if (!m) return;

                    music.setDisabled(false);
                    homebut.setDisabled(false);
                    filters.setDisabled(true);
                    settings.setDisabled(false);
                    misc.setDisabled(false);

                    return await m.edit({ embeds: [editEmbed], components: [new MessageActionRow().addComponents(homebut, music, filters, settings, misc)] }).catch(() => { });
                } else if (button.customId === homebut.customId) {

                    music.setDisabled(false);
                    homebut.setDisabled(true);
                    filters.setDisabled(false);
                    settings.setDisabled(false);
                    misc.setDisabled(false);

                    return await m.edit({ embeds: [embed1], components: [new MessageActionRow().addComponents(homebut, music, filters, settings, misc)] }).catch(() => { });
                } else if (button.customId === misc.customId) {
                    _commands = client.commands.filter((x) => x.category && x.category === "Misc").map((x) => `\`${x.name}\``);

                    editEmbed.setColor(color).setDescription(_commands.join(", ")).setTitle("Misc Commands").setFooter({ text: `Total ${_commands.length} misc commands.` });

                    if (!m) return;

                    music.setDisabled(false);
                    homebut.setDisabled(false);
                    filters.setDisabled(false);
                    settings.setDisabled(false);
                    misc.setDisabled(true);

                    return await m.edit({ embeds: [editEmbed], components: [new MessageActionRow().addComponents(homebut, music, filters, settings, misc)] }).catch(() => { });
                } else if (button.customId === settings.customId) {
                    _commands = client.commands.filter((x) => x.category && x.category === "Settings").map((x) => `\`${x.name}\``);

                    editEmbed.setColor(color).setDescription(_commands.join(", ")).setTitle("Settings Commands").setFooter({ text: `Total ${_commands.length} settings commands.` });

                    if (!m) return;

                    music.setDisabled(false);
                    homebut.setDisabled(false);
                    filters.setDisabled(false);
                    settings.setDisabled(true);
                    misc.setDisabled(false);

                    return await m.edit({ embeds: [editEmbed], components: [new MessageActionRow().addComponents(homebut, music, filters, settings, misc)] }).catch(() => { });
                } else return;
            });
        };
    }
}