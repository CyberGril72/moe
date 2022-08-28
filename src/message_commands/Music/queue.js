const { Message, Permissions, MessageActionRow, MessageButton } = require("discord.js");
const prettyMilliseconds = require("pretty-ms");
const Client = require("../../../index");
const { oops } = require("../../handlers/functions");
const { chunk } = require("lodash");

module.exports = {
    name: "queue",
    description: "Shows the server queue.",
    cooldown: 3,
    dev: false,
    usage: "[page]",
    aliases: ["q"],
    category: "Music",
    examples: ["queue", "queue 3"],
    sub_commands: [],
    args: false,
    player: { active: true, voice: true, dj: false, djPerm: null },
    permissions: {
        client: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS, Permissions.FLAGS.VIEW_CHANNEL],
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
        let player = client.player.get(message.guildId);
        if(!player.queue.size) {
            const embed1 = client.embed().setColor(color).setDescription(`${player.queue.current.title && player.queue.current.uri ? `[${player.queue.current.title}](${player.queue.current.uri})` : `${player.queue.current.title}`}${player.queue.current.duration ? " ~ `[ "+prettyMilliseconds(Number(player.queue.current.duration))+" ]` " : ""}${player.queue.current.requester ? ` ~ [${player.queue.current.requester}]` : ""}`).setTitle("Now playing").setImage(player.queue.current.displayThumbnail("maxresdefault") ? player.queue.current.displayThumbnail("maxresdefault") : null);

            return await message.reply({ embeds: [embed1] }).catch(() => {});
        } else {
            let map = player.queue.map((x, i) => `> \`[ ${++i} ]\` ~ ${x.title && x.uri ? `[${x.title}](${x.uri})` : `${x.title}`}${x.duration ? ` ~ \`[ ${prettyMilliseconds(Number(x.duration))} ]\`` : ""}${x.requester ? ` ~ [${x.requester}]` : ""}`);

            let pages = chunk(map, 8).map((x) => x.join("\n"));
            let page = 0;
            if(args[0]) page = parseInt(args[0]) - 1;
            if(isNaN(page)) page = 0;
            if(page < 0) page = 0;
            if(page >= pages.length) page = 0;

            let embed2 = client.embed().setColor(color).setDescription(`**Now playing**\n> ${player.queue.current.title && player.queue.current.uri ? `[${player.queue.current.title}](${player.queue.current.uri})` : `${player.queue.current.title}`}${player.queue.current.duration ? " ~ `[ "+prettyMilliseconds(Number(player.position))+" / "+prettyMilliseconds(Number(player.queue.current.duration))+" ]` " : ""}${player.queue.current.requester ? ` ~ [${player.queue.current.requester}]` : ""}\n\n**Queued Songs**\n${pages[page]}`).setTitle(`${message.guild.name} Server Queue`);

            if(pages.length <= 1) {
                embed2.setFooter({text: `Requested by ${message.author.username}`,iconURL: message.author.displayAvatarURL({ dynamic: true })});

                return await message.reply({ embeds: [embed2] }).catch(() => {});
            } else {
                embed2.setFooter({text: `Page ${page + 1} of ${pages.length}`, iconURL: message.author.displayAvatarURL({ dynamic: true })});

                let previousbut = new MessageButton().setCustomId(`queue_cmd_previous_but_${message.guildId}`).setStyle("SECONDARY").setEmoji("⬅️"); 

                let stopbut = new MessageButton().setCustomId(`queue_cmd_stop_but_${message.guildId}`).setStyle("SECONDARY").setEmoji("⏹️");

                let nextbut = new MessageButton().setCustomId(`queue_cmd_next_but_${message.guildId}`).setStyle("SECONDARY").setEmoji("➡️");

                const m = await message.reply({ embeds: [embed2], components: [new MessageActionRow().addComponents(previousbut, stopbut, nextbut)] });

                const collector = m.createMessageComponentCollector({
                    filter: (b) => {
                        if(b.user.id === message.author.id) return true;
                        else {
                            b.deferUpdate().catch(() => {});
                            return false;
                        };
                    },

                    time: 60000*5,
                    idle: 60000*5/2
                });

                collector.on("end", async () => {
                    if(m) await m.edit({ components: [new MessageActionRow().addComponents(previousbut.setDisabled(true), stopbut.setDisabled(true), nextbut.setDisabled(true))] })
                });

                collector.on("collect", async (button) => {
                    if(button.customId === previousbut.customId) {
                        if(!button.replied) await button.deferUpdate().catch(() => {});
                        page = page - 1 < 0 ? pages.length - 1 : --page;

                        if(m) return await m.edit({ embeds: [embed2.setDescription(`**Now playing**\n> ${player.queue.current.title && player.queue.current.uri ? `[${player.queue.current.title}](${player.queue.current.uri})` : `${player.queue.current.title}__**`}${player.queue.current.duration ? " ~ `[ "+prettyMilliseconds(Number(player.position))+" / "+prettyMilliseconds(Number(player.queue.current.duration))+" ]` " : ""}${player.queue.current.requester ? ` ~ [${player.queue.current.requester}]` : ""}\n\n**Queued Songs**\n${pages[page]}`).setFooter({text: `Page ${page + 1} of ${pages.length}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})] }).catch(() => {});
                    } else if(button.customId === stopbut.customId) {
                        if(!button.replied) await button.deferUpdate().catch(() => {});
                        return collector.stop();
                    } else if(button.customId === nextbut.customId) {
                        if(!button.replied) await button.deferUpdate().catch(() => {});
                        page = page + 1 >= pages.length ? 0 : ++page;

                        if(m) return await m.edit({ embeds: [embed2.setDescription(`**Now playing**\n> ${player.queue.current.title && player.queue.current.uri ? `[${player.queue.current.title}](${player.queue.current.uri})` : `${player.queue.current.title}`}${player.queue.current.duration ? " ~ `[ "+prettyMilliseconds(Number(player.position))+" / "+prettyMilliseconds(Number(player.queue.current.duration))+" ]` " : ""}${player.queue.current.requester ? ` ~ [${player.queue.current.requester}]` : ""}\n\n**Queued Songs**\n${pages[page]}`).setFooter({text: `Page ${page + 1} of ${pages.length}`,iconURL: message.author.displayAvatarURL({ dynamic: true })})] }).catch(() => {});
                    } else return;
                });
            };
        };
    }
}
