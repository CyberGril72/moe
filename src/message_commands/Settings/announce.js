const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { oops, msgReply } = require("../../handlers/functions");
const db = require("../../utils/schemas/announce");

module.exports = {
    name: "announce",
    description: "To configure the announcing of track start message.",
    cooldown: 5,
    dev: false,
    usage: "[sub_command]",
    aliases: [],
    category: "Settings",
    examples: ["announce", "announce set #music logs", "announce prunning"],
    sub_commands: ["set <TextChannel>", "prunning"],
    args: false,
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
        if(!args.length) {
            if(!data) {
                data = new db({
                    _id: message.guildId,
                    mode: true,
                    prunning: false,
                    moderator: message.author.id,
                    lastUpdated: Math.round(Date.now()/1000)
                });

                await data.save();
                return await msgReply(message, `Annoucing of track starting message is now enabled.`, color);
            } else {
                let mode = false;
                if(!data.mode) mode = true;

                data.mode = mode;
                data.moderator = message.author.id;
                data.lastUpdated = Math.round(Date.now()/1000);
                await data.save();

                if(mode) return await msgReply(message, `Annoucing of track starting message is now enabled.`, color);

                return await msgReply(message, `Annoucing of track starting message is now disabled.`, color);
            };
        } else {
            if(["set", "change"].includes(args[0])) {
                if(!args[1]) return await oops(message.channel, `Please provide or mention a channel.`, color);
                let channel = message.guild.channels.cache.get(args[1]) || message.mentions.channels.first();
                if(!channel) return await oops(message.channel, `Couldn't find the channel that you provided.`, color);
                if(!channel.isText()) return await oops(message.channel, `You've provided an invalid channel, please provide a text channel.`, color);

                if(!data) {
                    data = new db({
                        _id: message.guildId,
                        mode: true,
                        prunning: false,
                        channel: channel.id,
                        moderator: message.author.id,
                        lastUpdated: Math.round(Date.now()/1000)
                    });
    
                    await data.save();
                    return await msgReply(message, `Annoucing of track starting message is now enabled and channel set to <#${channel.id}>.`, color);
                } else {
                    if(data.channel && channel.id === data.channel) return await oops(message.channel, `This channel is already provided by <@${data.moderator}>`, color);

                    data.moderator = message.author.id;
                    data.channel = channel.id;
                    if(!data.mode) data.mode = true;
                    data.lastUpdated = Math.round(Date.now()/1000);
                    await data.save();

                    return await msgReply(message, `Announcing of track start message channel set to <#${channel.id}>`, color);
                };
            } else if(["prunning", "p"].includes(args[0])) {
                if(!data) {
                    data = new db({
                        _id: message.guildId,
                        mode: true,
                        prunning: true,
                        moderator: message.author.id,
                        lastUpdated: Math.round(Date.now()/1000)
                    });
    
                    await data.save();
                    return await msgReply(message, `Annoucing of track starting message and prunning is now enabled.`, color);
                } else {
                    let mode = false;
                    if(!data.prunning) mode = true;

                    data.prunning = mode;
                    data.moderator = message.author.id;
                    data.lastUpdated = Math.round(Date.now()/1000);
                    await data.save();
    
                    if(mode) return await msgReply(message, `Annoucing of track starting message prunning is now enabled.`, color);
    
                    return await msgReply(message, `Annoucing of track starting message prunning is now disabled.`, color);
                };
            } else {
                if(!data) {
                    data = new db({
                        _id: message.guildId,
                        mode: true,
                        prunning: false,
                        moderator: message.author.id,
                        lastUpdated: Math.round(Date.now()/1000)
                    });
    
                    await data.save();
                    return await msgReply(message, `Annoucing of track starting message is now enabled.`, color);
                } else {
                    let mode = false;
                    if(!data.mode) mode = true;
    
                    data.mode = mode;
                    data.moderator = message.author.id;
                    data.lastUpdated = Math.round(Date.now()/1000);
                    await data.save();
    
                    if(mode) return await msgReply(message, `Annoucing of track starting message is now enabled.`, color);
    
                    return await msgReply(message, `Annoucing of track starting message is now disabled.`, color);
                };
            };
        };
    }
}