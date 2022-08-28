const { Message, Permissions, MessageActionRow } = require("discord.js");
const Client = require("../../../index");
const { intReply, good } = require("../../handlers/functions");

module.exports = {
    name: "pause",
    description: "To pause the current playing song.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: ["pau"],
    category: "Music",
    examples: ["pause"],
    sub_commands: [],
    args: false,
    player: { active: true, voice: true, dj: true, djPerm: Permissions.FLAGS.DEAFEN_MEMBERS },
    permissions: {
        client: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS, Permissions.FLAGS.VIEW_CHANNEL],
        author: []
    },

    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     * @param {String} prefix
     * @param {String} color
     */

    execute: async (client, message, args, prefix, color) => {
        let player = client.player.get(message.guildId);
        const { title, uri } = player.queue.current;
        if(player.paused) {
            let b1 = client.button().setCustomId(`paused_button_kekekeke`).setEmoji("▶️").setStyle("SECONDARY");
            const m = await message.channel.send({ embeds: [client.embed().setColor(color).setDescription(`${title && uri ? `[${title}](${uri})` : `${title}`} is already paused.`)], components: [new MessageActionRow().addComponents(b1)] });

            const collector = m.createMessageComponentCollector({
                filter: (b) => {
                    if(b.user.id === message.author.id && b.customId === b1.customId) return true;
                    else {
                        b.deferUpdate().catch(() => {});
                        return false;
                    };
                },
                max: 1,
                time: 30000
            });

            collector.on("end", async () => {
                if(m) await m.edit({ components: [new MessageActionRow().addComponents(b1.setDisabled(true).setEmoji("⏸️"))] }).catch(() => {});
            });

            collector.on("collect", async (button) => {
                if(button.customId === b1.customId) {
                    if(!button.replied) await button.deferReply({ ephemeral: true }).catch(() => {});
                    if(player.paused) {
                        player.pause(false);
                        return await intReply(button, `${title && uri ? `[${title}](${uri})` : `${title}`} is now resumed/unpaused.`, color);
                    } else {
                        return await intReply(button, `${title && uri ? `[${title}](${uri})` : `${title}`} is already resumed/unpaused.`, color);
                    };
                } else return;
            });
        } else {
            player.pause(true);
            return await good(message.channel, `${title && uri ? `[${title}](${uri})` : `${title}`} is now paused.`, color);
        };
    }
}