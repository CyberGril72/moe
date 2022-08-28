const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { oops, msgReply, autoplay } = require("../../handlers/functions")
const db = require("../../utils/schemas/247");
module.exports = {
    name: "forceskip",
    description: "To force skip the current playing somg.",
    cooldown: 3,
    dev: false,
    usage: "",
    aliases: ["fs"],
    category: "Music",
    examples: ["forceskip"],
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
        let data = await db.findOne({ _id: message.guildId });
        if(!player.queue.size) {
            if(player.get("autoplay")) {
                const au = await autoplay(player, message.author);
                if(au === "failed") {
                    if(!data) {
                        if(player) player.destroy();
                        return await msgReply(message, `Force skipped and stopped the player due to no more tracks left in the queue.`, color);
                    } else {
                        if(data.mode) {
                            if(player) player.stop();
                            return await msgReply(message, `Force skipped [${player.queue.current.title}](${player.queue.current.uri})`, color);
                        } else {
                            if(player) player.destroy();
                            return await msgReply(message, `Force skipped and stopped the player due to no more tracks left in the queue.`, color);
                        };
                    };
                } else {
                    player.stop();
                    return await msgReply(message, `Force skipped [${player.queue.current.title}](${player.queue.current.uri})`, color);
                };
            } else {
                if(!data) {
                    if(player) player.destroy();
                    return await msgReply(message, `Force skipped and stopped the player due to no more tracks left in the queue.`, color);
                } else {
                    if(data.mode) {
                        if(player) player.stop();
                        return await msgReply(message, `Force skipped [${player.queue.current.title}](${player.queue.current.uri})`, color);
                    } else {
                        if(player) player.destroy();
                        return await msgReply(message, `Force skipped and stopped the player due to no more tracks left in the queue.`, color);
                    };
                };
            };
        } else {
            player.stop();
            return await msgReply(message, `Force skipped [${player.queue.current.title}](${player.queue.current.uri})`, color);
        };
    }
}