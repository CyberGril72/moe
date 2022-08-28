const { Message, Permissions, MessageActionRow } = require("discord.js");
const Client = require("../../../index");
const lodash = require("lodash");

module.exports = {
    name: "commands",
    description: "Show the commands list.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: ["cmds"],
    category: "Misc",
    examples: ["commands", "cmds"],
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
        let commands = client.commands.filter((x) => x.category && x.category !== "Dev").map((x) => `> \`${prefix}${x.name}\`: ${x.description}`);
        let pages = lodash.chunk(commands, 10).map((x) => x.join("\n"));
        let page = 0;

        let previousbut = client.button().setCustomId("previous_but_commands_cmd").setEmoji("⬅️").setStyle("SECONDARY");
        let nextbut = client.button().setCustomId("nextbut_but_commands_cmd").setEmoji("➡️").setStyle("SECONDARY");
        let stopbut = client.button().setCustomId("stop_but_commands_cmd").setEmoji("⏹️").setStyle("SECONDARY");

        let embed1 = client.embed().setColor(color).setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() }).setTitle("Commands List(s)").setFooter({ text: `Page ${page + 1} of ${pages.length}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setDescription(`**Total commands:** \`[ ${commands.length} ]\`\n\n${pages[page]}\n\n*Note: To get more extended view/info of these commands, do \`${prefix}help <command_name>\`*`);

        const m = await message.reply({
            allowedMentions: { repliedUser: false },
            embeds: [embed1],
            components: [new MessageActionRow().addComponents(previousbut, stopbut, nextbut)]
        });

        const collector = m.createMessageComponentCollector({
            filter: (b) => {
                if (b.user.id === message.author.id) return true;
                else {
                    b.deferUpdate().catch(() => { });
                    return false;
                };
            },
            time: 60000 * 5,
            idle: 60000 * 5 / 2
        });

        collector.on("end", async () => {
            if (!m) return;
            await m.edit({ components: [new MessageActionRow().addComponents(previousbut.setDisabled(true), stopbut.setDisabled(true), nextbut.setDisabled(true))] }).catch(() => { });
        });

        collector.on("collect", async (button) => {
            if (!button.deferred) await button.deferUpdate().catch(() => { });
            if (button.customId === previousbut.customId) {
                page = page - 1 < 0 ? pages.length - 1 : --page;
                embed1.setDescription(`**Total commands:** \`[ ${commands.length} ]\`\n\n${pages[page]}\n\n*Note: To get more extended view/info of these commands, do \`${prefix}help <command_name>\`*`).setFooter({ text: `Page ${page + 1} of ${pages.length}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

                if (!m) return;
                await m.edit({ embeds: [embed1] }).catch(() => { });
            } else if (button.customId === stopbut.customId) {
                return collector.stop();
            } else if (button.customId === nextbut.customId) {
                page = page + 1 > pages.length - 1 ? 0 : ++page;
                embed1.setDescription(`**Total commands:** \`[ ${commands.length} ]\`\n\n${pages[page]}\n\n*Note: To get more extended view/info of these commands, do \`${prefix}help <command_name>\`*`).setFooter({ text: `Page ${page + 1} of ${pages.length}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

                if (!m) return;
                await m.edit({ embeds: [embed1] }).catch(() => { });
            } else return;
        });
    }
}