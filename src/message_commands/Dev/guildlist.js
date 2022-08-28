const { Message, Permissions, MessageActionRow } = require("discord.js");
const Client = require("../../../index");
const lodash = require("lodash");

module.exports = {
    name: "guildlist",
    description: "To see the guild list.",
    cooldown: 3,
    dev: true,
    usage: "",
    aliases: [],
    category: "Dev",
    examples: [],
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
        let guilds = client.guilds.cache.map((x, i) => `> \`[ ${++i} ]\` ~ **${x.name}** ~ (\`id: ${x.id}\`) ~ \`[ ${x.memberCount} ]\``);

        const pages = lodash.chunk(guilds, 10).map((x) => x.join("\n"));
        let page = 0;

        let embed = client.embed().setColor(color).setDescription(`**Total Guilds:** \`[ ${guilds.length} ]\`\n\n${pages[page]}`).setFooter({text: `Page ${page + 1} of ${pages.length}`}).setTitle(`${client.user.username} Guild Lists`);

        let x = client.button().setCustomId("_x_dev000").setEmoji(client.config.emojis.previous).setStyle("SECONDARY");

        let y = client.button().setCustomId("_y_dev000").setEmoji(client.config.emojis.stop).setStyle("SECONDARY");

        let z = client.button().setCustomId("_z_dev000").setEmoji(client.config.emojis.next).setStyle("SECONDARY");

        let row1 = new MessageActionRow().addComponents(x, y, z);

        const m = await message.reply({ embeds: [embed], components: [row1] });

        const collector = m.createMessageComponentCollector({
            componentType: "BUTTON",
            filter: (e) => e.user.id === message.author.id,
            time: 60000
        });

        collector.on("end", async () => {
            if(!m) return;
            await m.edit({ components: [new MessageActionRow().addComponents(x.setDisabled(true), y.setDisabled(true), z.setDisabled(true))] }).catch(() => {});
        });

        collector.on("collect", async (button) => {
            if(!button.deferred) await button.deferUpdate().catch(() => {});

            if(button.customId === x.customId) {
                if(!m) return;

                page = page - 1 <= 0 ? pages.length - 1 : --page;

                embed.setDescription(`**Total Guilds:** \`[ ${guilds.length} ]\`\n\n${pages[page]}`).setFooter({text: `Page ${page + 1} of ${pages.length}`});

                await m.edit({ embeds: [embed] }).catch(() => {});
            } else if(button.customId === y.customId) {
                return collector.stop();
            } else if(button.customId === z.customId) {
                if(!m) return;

                page = page + 1 >= pages.length ? 0 : ++page;

                embed.setDescription(`**Total Guilds:** \`[ ${guilds.length} ]\`\n\n${pages[page]}`).setFooter({text: `Page ${page + 1} of ${pages.length}`});

                await m.edit({ embeds: [embed] }).catch(() => {});
            } else return;
        });
    }
}