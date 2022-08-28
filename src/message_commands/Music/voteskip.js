const { Message, Permissions, MessageActionRow } = require("discord.js");
const Client = require("../../../index");
const { oops, msgReply, autoplay } = require("../../handlers/functions");
const prettyMilliseconds = require("pretty-ms");
const db = require("../../utils/schemas/247");

module.exports = {
    name: "voteskip",
    description: "To voteskip the current playing song.",
    cooldown: 10,
    dev: false,
    usage: "[min_votes] [max_votes]",
    aliases: ["vs"],
    category: "Music",
    examples: ["voteskip", "voteskip 2", "voteskip 2 7"],
    sub_commands: [],
    args: false,
    player: { active: true, voice: true, dj: false, djPerm: Permissions.FLAGS.DEAFEN_MEMBERS },
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
        const player = client.player.get(message.guildId);
        let vc = message.guild.me.voice.channel;

        if (vc.members.size <= 2) return await oops(message.channel, `Don't have enough peeps left in the voice channel to conduct this vote skip.`, color);

        let min = Math.round(vc.members.size - 1 / 2);
        let max = Math.round(vc.members.size - 1 / 2);

        if (args[0]) min = parseInt(args[0]);
        if (args[1]) max = parseInt(args[1]);

        if (isNaN(min)) min = Math.round((vc.members.size - 1) / 2);
        if (isNaN(max)) max = Math.round((vc.members.size - 1) / 2);

        if (min <= 0) min = Math.round((vc.members.size - 1) / 2);
        if (max <= 0) max = Math.round((vc.members.size - 1) / 2);

        if (min >= vc.members.size) min = Math.round((vc.members.size - 1) / 2);
        if (max >= vc.members.size) max = Math.round((vc.members.size - 1) / 2);

        let time = 60000 * 2;

        let votersList = [];

        const embed1 = client.embed().setColor(color).setDescription(`A vote skip is being conducted by <@${message.author.id}>.`).setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) }).setTitle(`Vote Skip`).addField("Minimum Votes Required", `\`[ ${min} ]\``, true).addField("Maximum Votes", `\`[ ${max} ]\``, true).addField("Votes Count", `\`[ ${votersList.length} ]\``, true).setFooter({ text: `This vote skipping will end in ${prettyMilliseconds(Number(time))}` });

        let buttonE = client.button().setCustomId(`vote_skip_but_${message.guildId}`).setLabel("Vote").setStyle("PRIMARY");

        const m = await message.reply({
            embeds: [embed1],
            components: [new MessageActionRow().addComponents(buttonE)]
        });

        const collector = m.createMessageComponentCollector({
            filter: (b) => b.member.voice.channel && b.member.voice.channelId === b.guild.me.voice.channelId && b.customId === buttonE.customId ? true : false,
            time: time,
            idle: time / 2
        });

        collector.on("end", async () => {
            if (m) await m.edit({ components: [new MessageActionRow().addComponents(buttonE.setDisabled(true))] }).catch(() => { });

            if (votersList.length >= max) return;
            if (votersList.length >= min) {
                if (!player) return;
                if (!player.queue) return;
                if (!player.queue.current) return;

                if (player.queue.size) {
                    player.stop();
                    return await msgReply(message, `Vote Skipped [${player.queue.current.title}](${player.queue.current.uri})`, color);
                } else {
                    let data = await db.findOne({ _id: message.guildId });
                    if (player.get("autoplay")) {
                        let au = await autoplay(player, message.author);
                        if (au === "failed") {
                            if (data && data.mode) {
                                player.stop();
                                return await msgReply(message, `Vote Skipped [${player.queue.current.title}](${player.queue.current.uri})`, color);
                            } else {
                                player.destroy();
                                return await msgReply(message, `Vote skipped and left the voice channel due to no more songs left in the queue.`, color);
                            };
                        } else {
                            player.stop();
                            return await msgReply(message, `Vote Skipped [${player.queue.current.title}](${player.queue.current.uri})`, color);
                        };
                    };

                    if (data && data.mode) {
                        player.stop();
                        return await msgReply(message, `Vote Skipped [${player.queue.current.title}](${player.queue.current.uri})`, color);
                    } else {
                        player.destroy();
                        return await msgReply(message, `Vote skipped and left the voice channel due to no more songs left in the queue.`, color);
                    };
                };
            };
        });

        collector.on("collect", async (button) => {
            if (!button.deferred) await button.deferUpdate().catch(() => { });

            let v = votersList.find((x) => x === button.user.id);
            if (v) return;

            votersList.push(button.user.id);
            if (m) await m.edit({ embeds: [embed1.addField("Voters", `${votersList.map((x) => `<@${x}>`).join(", ")}`, true)] }).catch(() => { });

            if (votersList.length >= max) {
                if (!player) return await oops(message.channel, `Nothing is playing right now to skip.`, color);
                if (!player.queue) return await oops(message.channel, `Nothing is playing right now to skip.`, color);
                if (!player.queue.current) return await oops(message.channel, `Nothing is playing right now to skip.`, color);

                if (player.queue.size) {
                    player.stop();
                    return await msgReply(message, `Vote Skipped [${player.queue.current.title}](${player.queue.current.uri})`, color);
                } else {
                    let data = await db.findOne({ _id: message.guildId });
                    if (player.get("autoplay")) {
                        let au = await autoplay(player, message.author);
                        if (au === "failed") {
                            if (data && data.mode) {
                                player.stop();
                                return await msgReply(message, `Vote Skipped [${player.queue.current.title}](${player.queue.current.uri})`, color);
                            } else {
                                player.destroy();
                                return await msgReply(message, `Vote skipped and left the voice channel due to no more songs left in the queue.`, color);
                            };
                        } else {
                            player.stop();
                            return await msgReply(message, `Vote Skipped [${player.queue.current.title}](${player.queue.current.uri})`, color);
                        };
                    };

                    if (data && data.mode) {
                        player.stop();
                        return await msgReply(message, `Vote Skipped [${player.queue.current.title}](${player.queue.current.uri})`, color);
                    } else {
                        player.destroy();
                        return await msgReply(message, `Vote skipped and left the voice channel due to no more songs left in the queue.`, color);
                    };
                };
            };
        });
    }
}