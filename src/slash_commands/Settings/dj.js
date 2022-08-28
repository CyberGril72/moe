const Client = require("../../../index");
const { CommandInteraction, Permissions, MessageActionRow } = require("discord.js");
const db = require("../../utils/schemas/dj");
const { intReply } = require("../../handlers/functions");
const lodash = require("lodash");

module.exports = {
    data: {
        name: "dj",
        description: "Configuration of dj role.",
        options: [
            {
                name: "add",
                description: "To add a role to dj role(s).",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "role",
                        description: "The role to add.",
                        type: "ROLE",
                        required: true
                    }
                ]
            },

            {
                name: "clear",
                description: "To clear all dj role data.",
                type: "SUB_COMMAND"
            },

            {
                name: "toggle",
                description: "To toggle enable/disable dj mode.",
                type: "SUB_COMMAND"
            },

            {
                name: "remove",
                description: "To remove a added role from dj role(s).",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "role_number",
                        description: "The role number from dj role list.",
                        type: "NUMBER",
                        required: true
                    }
                ]
            },

            {
                name: "list",
                description: "Shows the dj role(s) list.",
                type: "SUB_COMMAND"
            },

            {
                name: "info",
                description: "Gets info about the dj setup.",
                type: "SUB_COMMAND"
            },

            {
                name: "members",
                description: "Shows the dj members (One's who has the dj role).",
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

        if(interaction.options.getSubcommand() === "add") {
            if(!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

            const role = interaction.options.getRole("role");
            if(!role) return await intReply(interaction, `Please provide a dj role.`, color);

            if(!data) {
                data = new db({
                    _id: interaction.guildId,
                    mode: true,
                    roles: [role.id],
                    moderator: interaction.user.id,
                    lastUpdated: Math.round(Date.now()/1000)
                });

                await data.save();
                return await intReply(interaction, `Added ${role} to dj role(s).`, color);
            } else {
                if(!data.mode) return await intReply(interaction, `Dj mode is currently disabled, please  enable it to use this command.`, color);

                let roleCheck = data.roles.find((x) => x === role.id);
                if(roleCheck) return await intReply(interaction, `This role is already given!`, color);

                data.roles.push(role.id);
                data.lastUpdated = Math.round(Date.now()/1000);
                data.moderator = interaction.user.id;

                await data.save();
                return await intReply(interaction, `Added ${role} to dj role(s).`, color);
            };
        } else if(interaction.options.getSubcommand() === "toggle") {
            if(!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

            if(!data) return await intReply(interaction, `No dj setup data found for this server.`, color);

            let m = false;
            if(!data.mode) m = true;

            data.mode = m;
            await data.save();

            if(m) {
                return await intReply(interaction, `Dj mode is now enabled.`, color);
            } else {
                return await intReply(interaction, `Dj mode is now disabled.`, color);
            };
        } else if (interaction.options.getSubcommand() === "clear") {
            if(!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) return await intReply(interaction, `You don't have enough permission to use this command.`, color);
            if(!data) return await intReply(interaction, `No data found for this server to clear.`, color);

            await data.delete();
            return await intReply(interaction, `Successfully cleared all dj roles.`, color);
        } else if(interaction.options.getSubcommand() === "info") {
            if(!data) return await intReply(interaction, `No dj role data found for this server.`, color);

            let roles = [];

            for (let r of data.roles) {
                let x = interaction.guild.roles.cache.get(r);
                if(x) roles.push(x.name);
            };

            let e;

            if(roles.length > 50) e = `${roles.splice(0, 50).map((x) => `@${x}`).join(", ")}...`
            else if(roles.length <= 0) e = "None";
            else e = roles.map((x) => `@${x}`).join(", ");

            return await interaction.editReply({
                embeds: [client.embed().setColor(color).setTitle(`DJ Setup Info`).setAuthor({name: `${interaction.guild.name}`,iconURL: `${interaction.guild.iconURL({ dynamic: true })}`}).addFields([
                    {
                        name: "Role",
                        value: `${e}`,
                        inline: true
                    },

                    {
                        name: "Moderator",
                        value: `<@${data.moderator}> (\`id: ${data.moderator}\`)`,
                        inline: true
                    },

                    {
                        name: "Last Updated",
                        value: `<t:${data.lastUpdated}>`,
                        inline: true
                    },

                    {
                        name: "Dj Mode",
                        value: `${data.mode ? "Enabled" : "Disabled"}`
                    },

                    {
                        name: "Available DJ Commands",
                        value: `\`\`\`\n${client.slash_commands.filter((x) => x.dj).map((x) => x.data.name).join(", ")}\n\`\`\``
                    }
                ]).setFooter({text: `Requested by ${interaction.user.username}`,iconURL: interaction.user.displayAvatarURL({ dynamic: true })})]
            }).catch(() => {});
        } else if(interaction.options.getSubcommand() === "members") {
            if(!data) return await intReply(interaction, `No dj setup data found for this server.`, color);
            if(!data.roles.length || data.roles.length <= 0) return await intReply(interaction, `Don't have any dj role(s) to get the members.`, color);
            let m = [];

            for (let r of data.roles) {
                let role = interaction.guild.roles.cache.get(r);
                if(role) {
                    role.members.forEach((x) => {
                        if(!m.includes(x.user.id)) m.push(x.user.id);
                    });
                };
            };

            let members;
            if(m.length > 50) members = `${m.splice(0, 50).map((x) => `<@${x}>`).join(", ")}...`;
            else if(m.length <= 0) members = "None";
            else members = m.map((x) => `<@${x}>`).join(", ");
            let embed2 = client.embed().setColor(color).setDescription(`${members}`).setTitle("Dj Member(s)");

            return await interaction.editReply({ embeds: [embed2] }).catch(() => {});
        } else if(interaction.options.getSubcommand() === "remove") {
            if(!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

            if(!data) return await intReply(interaction, `No dj setup data found for this server.`, color);
            if(!data.roles.length || data.roles.length <= 0) return await intReply(interaction, `Don't have any dj role(s) remove.`, color);

            let num = interaction.options.getNumber("role_number");

            if(num <= 0) return await intReply(interaction, `Role number shouldn't be less than or equal to 0.`, color);
            if(num > data.roles.length) return await intReply(interaction, `Role number shouldn't be higher than the dj roles length.`, color);

            data.roles.splice(num - 1, 1);
            await data.save();

            return await intReply(interaction, `Removed role number \`[ ${num} ]\` from dj role(s).`, color);
        } else if(interaction.options.getSubcommand() === "list") {
            if(!interaction.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

            if(!data) return await intReply(interaction, `Don't have any dj role setup to use this sub command.`, color);

            if(!data.roles.length || data.roles.length <= 0) return await intReply(interaction, `Don't have any dj role(s) added!`, color);

            let roles = [];

            for (const r of data.roles) {
                let x = interaction.guild.roles.cache.get(r);
                if(x) roles.push(x.name);
            };

            let map = roles.map((x, i) => `\`[ ${++i} ]\` ~ @${x}`);
            const pages = lodash.chunk(map, 10).map((x) => x.join("\n"));
            let page = 0;

            let embed1 = client.embed().setColor(color).setDescription(`${pages[page]}`).setTitle(`Dj Role(s)`).setAuthor({name: interaction.guild.name,iconURL: interaction.guild.iconURL({ dynamic: true })});

            if(pages.length <= 1) {
                embed1.setFooter({text: `Total ${map.length} dj role(s)`});

                return await interaction.editReply({ embeds: [embed1] }).catch(() => {});
            } else {
                let pbut = client.button().setCustomId(`dj_roles_list_but_previous`).setEmoji(client.config.emojis.previous).setStyle("SECONDARY");

                let sbut = client.button().setCustomId(`dj_roles_list_but_stop`).setEmoji(client.config.emojis.stop).setStyle("SECONDARY");

                let nbut = client.button().setCustomId(`dj_roles_list_but_next`).setEmoji(client.config.emojis.next).setStyle("SECONDARY");

                let row1 = new MessageActionRow().addComponents(pbut, sbut, nbut);

                embed1.setFooter({text: `Page ${page + 1} of ${pages.length}`});

                await interaction.editReply({ embeds: [embed1], components: [row1] });

                const collector = interaction.channel.createMessageComponentCollector({
                    componentType: "BUTTON",
                    filter: (b) => {
                        if(b.user.id === interaction.author.id) return true;
                        else return false;
                    },
                    time: 60000*2,
                    idle: 60000
                });

                collector.on("end", async () => {
                    await interaction.editReply({ components: [new MessageActionRow().addComponents(pbut.setDisabled(true, sbut.setDisabled(true), nbut.setDisabled(true)))] })
                });

                collector.on("collect", async (button) => {
                    if(!button.deferred) await button.deferUpdate().catch(() => {});

                    if(button.customId === pbut.customId) {
                        page = page - 1 < 0 ? pages.length - 1 : --page;
                        embed1.setDescription(`${pages[page]}`).setFooter({text: `Page ${page + 1} of ${pages.length}`});

                        await interaction.editReply({ embeds: [embed1] }).catch(() => {});
                    } else if(button.customId === sbut.customId) {
                        return collector.stop();
                    } else if(button.customId === nbut.customId) {
                        page = page + 1 >= pages.length ? 0 : ++page;
                        embed1.setDescription(`${pages[page]}`).setFooter({text: `Page ${page + 1} of ${pages.length}`});

                        await interaction.editReply({ embeds: [embed1] }).catch(() => {});
                    } else return;
                });

            };
        } else return;
    }
}