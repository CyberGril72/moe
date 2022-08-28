const { Message, Permissions, MessageActionRow } = require("discord.js");
const Client = require("../../../index");
const { oops, msgReply, invalidArgs } = require("../../handlers/functions");
const db = require("../../utils/schemas/dj");
const lodash = require("lodash");

module.exports = {
    name: "dj",
    description: "To set/change/clear the dj role.",
    cooldown: 10,
    dev: false,
    usage: "<sub_command>",
    aliases: [],
    category: "Settings",
    examples: ["dj add @Dj", "dj clear", "dj info", "dj members", "dj remove 2", "dj list", "dj toggle"],
    sub_commands: ["add <role>", "clear", "remove <role_number>", "info", "members", "list", "toggle"],
    args: true,
    player: { active: false, voice: false, dj: false, djPerm: null },
    permissions: {
        client: [],
        author: [Permissions.FLAGS.MANAGE_GUILD]
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
        let data = await db.findOne({ _id: message.guildId });

        if (["add", "a", "set", "s"].includes(args[0])) {
            if (!args[1]) return await oops(message.channel, `Please provide a role to add.`, color);

            const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
            if (!role) return await oops(message.channel, `Couldn't find the given role.`, color);

            if (!data) {
                data = new db({
                    _id: message.guildId,
                    roles: [role.id],
                    moderator: message.author.id,
                    mode: true,
                    lastUpdated: Math.round(Date.now() / 1000)
                });

                await data.save();
                return await msgReply(message, `Added ${role} to dj role(s).`, color);
            } else {
                if (!data.mode) return await oops(message.channel, `Dj mode is currently disabled, please enable to use this sub command.`, color);

                let roleCheck = data.roles.find((x) => x === role.id);
                if (roleCheck) return await oops(message.channel, `This role is already given!`, color);

                data.roles.push(role.id);
                data.lastUpdated = Math.round(Date.now() / 1000);
                data.moderator = message.author.id;

                await data.save();
                return await msgReply(message, `Added ${role} to dj role(s).`, color);
            };
        } else if (["toggle", "t"].includes(args[0])) {
            if (!data) return await oops(message.channel, `Don't have any dj role setup to use this sub command.`, color);

            let m = false;
            if (!data.mode) m = true

            data.mode = m;
            await data.save();

            if (m) {
                await msgReply(message, `Dj mode is now enabled.`, color);
            } else {
                await msgReply(message, `Dj mode is now disabled.`, color);
            };
        } else if (["clear", "reset"].includes(args[0])) {
            if (!data) return await oops(message.channel, `Don't have any dj role setup to use this sub command.`, color);

            await data.delete();
            return await msgReply(message, `Successfully deleted the dj role(s) setup.`, color);
        } else if (["info", "stats"].includes(args[0])) {
            if (!data) return await oops(message.channel, `Don't have any dj role setup to use this sub command.`, color);
            let roles = [];

            for (let r of data.roles) {
                let x = message.guild.roles.cache.get(r);
                if (x) roles.push(x.name);
            };

            let e;

            if (roles.length > 50) e = `${roles.splice(0, 50).map((x) => `@${x}`).join(", ")}...`
            else if (roles.length <= 0) e = "None";
            else e = roles.map((x) => `@${x}`).join(", ");

            const embed1 = client.embed().setColor(color).setTitle(`DJ Setup Info`).setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true })).addFields([
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
                    name: "DJ commands",
                    value: `\`\`\`\n${client.commands.filter((x) => x.player && x.player.dj).map((x) => x.name).join(", ")}\n\`\`\``,
                    inline: true
                }
            ]);

            return await message.reply({ embeds: [embed1] }).catch(() => { });
        } else if (["members", "users", "m"].includes(args[0])) {
            if (!data) return await oops(message.channel, `Don't have any dj role setup to use this sub command.`, color);

            let m = [];

            for (let r of data.roles) {
                let role = message.guild.roles.cache.get(r);
                if (role) {
                    role.members.forEach((x) => {
                        if (!m.includes(x.user.id)) m.push(x.user.id);
                    });
                };
            };

            let members;
            if (m.length > 50) members = `${m.splice(0, 50).map((x) => `<@${x}>`).join(", ")}...`;
            else if (m.length <= 0) members = "None";
            else members = m.map((x) => `<@${x}>`).join(", ");
            let embed2 = client.embed().setColor(color).setDescription(`${members}`).setTitle("Dj Member(s)");

            return await message.reply({ embeds: [embed2] }).catch(() => { });
        } else if (["remove", "delete"].includes(args[0])) {
            if (!data) return await oops(message.channel, `Don't have any dj role setup to use this sub command.`, color);

            if (!data.roles.length || data.roles.length <= 0) return await oops(message.channel, `Don't have any dj role(s) added to remove.`, color);

            if (!args[1]) return await oops(message.channel, `Please provide the role number in dj role(s) list.`, color);

            let index = parseInt(args[1]);

            if (isNaN(index)) return await oops(message.channel, `Please provide a valid track number.`, color);
            if (index <= 0) return await oops(message.channel, `Role number shouldn't be lower than or equal to 0.`, color);
            if (index > data.roles.length) return await oops(message.channel, `Role number shouldn't be higher than the dj role(s) length.`, color);

            data.roles.splice(index - 1, 1);
            await data.save();

            return await msgReply(message, `Removed role number \`[ ${index} ]\` from the dj role(s).`, color);
        } else if (["list", "roles"].includes(args[0])) {
            if (!data) return await oops(message.channel, `Don't have any dj role setup to use this sub command.`, color);

            if (!data.roles.length || data.roles.length <= 0) return await oops(message.channel, `Don't have any dj role(s) added!`, color);

            let roles = [];

            for (const r of data.roles) {
                let x = message.guild.roles.cache.get(r);
                if (x) roles.push(x.name);
            };

            let map = roles.map((x, i) => `\`[ ${++i} ]\` ~ @${x}`);
            const pages = lodash.chunk(map, 10).map((x) => x.join("\n"));
            let page = 0;

            let embed1 = client.embed().setColor(color).setDescription(`${pages[page]}`).setTitle(`Dj Role(s)`).setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true }));

            if (pages.length <= 1) {
                embed1.setFooter({ text: `Total ${map.length} dj role(s)` });

                return await message.reply({ embeds: [embed1] }).catch(() => { });
            } else {
                let pbut = client.button().setCustomId(`dj_roles_list_but_previous`).setEmoji(client.config.emojis.previous).setStyle("SECONDARY");

                let sbut = client.button().setCustomId(`dj_roles_list_but_stop`).setEmoji(client.config.emojis.stop).setStyle("SECONDARY");

                let nbut = client.button().setCustomId(`dj_roles_list_but_next`).setEmoji(client.config.emojis.next).setStyle("SECONDARY");

                let row1 = new MessageActionRow().addComponents(pbut, sbut, nbut);

                embed1.setFooter({ text: `Page ${page + 1} of ${pages.length}` });

                const m = await message.reply({ embeds: [embed1], components: [row1] });

                const collector = m.createMessageComponentCollector({
                    componentType: "BUTTON",
                    filter: (b) => {
                        if (b.user.id === message.author.id) return true;
                        else return false;
                    },
                    time: 60000 * 2,
                    idle: 60000
                });

                collector.on("end", async () => {
                    if (!m) return;
                    await m.edit({ components: [new MessageActionRow().addComponents(pbut.setDisabled(true, sbut.setDisabled(true), nbut.setDisabled(true)))] })
                });

                collector.on("collect", async (button) => {
                    if (!button.deferred) await button.deferUpdate().catch(() => { });

                    if (button.customId === pbut.customId) {
                        if (!m) return;

                        page = page - 1 < 0 ? pages.length - 1 : --page;
                        embed1.setDescription(`${pages[page]}`).setFooter({ text: `Page ${page + 1} of ${pages.length}` });

                        await m.edit({ embeds: [embed1] }).catch(() => { });
                    } else if (button.customId === sbut.customId) {
                        return collector.stop();
                    } else if (button.customId === nbut.customId) {
                        if (!m) return;

                        page = page + 1 >= pages.length ? 0 : ++page;
                        embed1.setDescription(`${pages[page]}`).setFooter({ text: `Page ${page + 1} of ${pages.length}` });

                        await m.edit({ embeds: [embed1] }).catch(() => { });
                    } else return;
                });
            };
        } else return await invalidArgs("dj", message, "Please provide a valid sub command.", client);
    }
}