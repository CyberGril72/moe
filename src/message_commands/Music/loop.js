const { Message, Permissions, MessageActionRow } = require("discord.js");
const Client = require("../../../index");
const { good, oops, intReply, invalidArgs } = require("../../handlers/functions")

module.exports = {
    name: "loop",
    description: "To loop the current palying song/queue.",
    cooldown: 3,
    dev: false,
    usage: "<input>",
    aliases: ["l", "repeat"],
    category: "Music",
    examples: ["loop track", "loop queue"],
    sub_commands: [],
    args: false,
    player: { active: true, voice: true, dj: true, djPerm: Permissions.FLAGS.DEAFEN_MEMBERS },
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
        const { title, uri } = player.queue.current;

        if(args.length) {
            if(args[0] === "track") {
                if(player.trackRepeat) {
                    player.setTrackRepeat(false);
                    return await good(message.channel, `${title && uri ? `[${title}](${uri})` : title || "Track"} looping/repeating is now disabled.`, color);
                } else {
                    player.setTrackRepeat(true);
                    return await good(message.channel, `${title && uri ? `[${title}](${uri})` : title || "Track"} looping/repeating is now enabled.`, color);
                };
            } else if(args[0] === "queue") {
                if(!player.queue.size) return await oops(message.channel, `Don't have enough tracks in the queue to loop/repeat.`, color);

                if(player.queueRepeat) {
                    player.setQueueRepeat(false);
                    return await good(message.channel, `Queue looping/repeating is now disabled.`, color);
                } else {
                    player.setQueueRepeat(true);
                    return await good(message.channel, `Queue looping/repeating is now enabled.`, color);
                };
            } else return await invalidArgs("loop", message, "Please provide a valid argument.", client);
        } else {
            const embed1 = client.embed().setColor(color).setDescription(`Which one do you want to enable/disable the loop/repeat?`);

            const but1 = client.button().setCustomId("loop_track_but").setLabel("Track").setStyle("PRIMARY");
            const but2 = client.button().setCustomId("loop_queue_but").setLabel("Queue").setStyle("PRIMARY");

            if(!player.queue.size) but2.setDisabled(true);

            const m = await message.channel.send({ embeds: [embed1], components: [new MessageActionRow().addComponents(but1, but2)] });

            const collector = m.createMessageComponentCollector({
                filter: (b) => {
                    if(b.user.id === message.author.id) return true;
                    else {
                        b.deferUpdate().catch(() => {});
                        return false;
                    };
                },
                max: 1,
                time: 60000,
                idle: 60000/2
            });

            collector.on("end", async () => {
                if(!m) return;
                await m.edit({ components: [new MessageActionRow().addComponents(but1.setDisabled(true), but2.setDisabled(true))] }).catch(() => {});
            });

            collector.on("collect", async (button) => {
                if(!player && !button.replied) return await button.deferUpdate().catch(() => {});
                if(!button.replied) await button.deferReply().catch(() => {});
                if(button.customId === but1.customId) {
                    if(player.trackRepeat) {
                        player.setTrackRepeat(false);
                        return await intReply(button, `${title && uri ? `[${title}](${uri})` : title || "Track"} looping/repeating is now disabled.`, color);
                    } else {
                        player.setTrackRepeat(true);
                        return await intReply(button, `${title && uri ? `[${title}](${uri})` : title || "Track"} looping/repeating is now enabled.`, color);
                    };
                } else if(button.customId === but2.customId) {
                    if(player.queueRepeat) {
                        player.setQueueRepeat(false);
                        return await intReply(button, `Queue looping/repeating is now disabled.`, color);
                    } else {
                        player.setQueueRepeat(true);
                        return await intReply(button, `Queue looping/repeating is now enabled.`, color);
                    };
                } else return;
            });
        };
    }
}