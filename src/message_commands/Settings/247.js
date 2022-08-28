const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { msgReply } = require("../../handlers/functions")
const db = require("../../utils/schemas/247");

module.exports = {
    name: "247",
    description: "To toggle enable/disable 24/7 mode.",
    cooldown: 60,
    dev: false,
    usage: "",
    aliases: ["24/7", "24h"],
    category: "Settings",
    examples: ["247"],
    sub_commands: [],
    args: false,
    player: { active: false, voice: true, dj: false, djPerm: null },
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
        let player = client.player.get(message.guildId);

        if(!data) {
            data = new db({
                _id: message.guildId,
                mode: true,
                textChannel: message.channelId,
                voiceChannel: message.member.voice.channelId,
                moderator: message.author.id,
                lastUpdated: Math.round(Date.now()/1000)
            });

            await data.save();

            if(!player) player = client.player.create({ guild: message.guildId, textChannel: message.channelId, voiceChannel: message.member.voice.channelId, volume: 80, selfDeafen: true });

            if(player.state !== "CONNECTED") player.connect();

            return await msgReply(message, `24/7 mode is now enabled.`, color);
        } else {
            if(data.mode) {
                data.mode = false;
                data.moderator = message.author.id;
                data.lastUpdated = Math.round(Date.now()/1000);

                await data.save();
                return await msgReply(message, `24/7 mode is now disabled.`, color);
            } else {
                data.mode = true;
                data.textChannel = message.channelId;
                data.voiceChannel = message.member.voice.channelId;
                data.moderator = message.author.id;
                data.lastUpdated = Math.round(Date.now()/1000);

                await data.save();

                if(!player) player = client.player.create({ guild: message.guildId, textChannel: message.channelId, voiceChannel: message.member.voice.channelId, volume: 80, selfDeafen: true });

                if(player.state !== "CONNECTED") player.connect();

                return await msgReply(message, `24/7 mode is now enabled.`, color);
            };
        };
    }
}
