const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { oops, intReply, msgReply } = require("../../handlers/functions")

module.exports = {
    name: "join",
    description: "Joins your voice channel!",
    cooldown: 5,
    dev: false,
    usage: "",
    aliases: ["j"],
    category: "Music",
    examples: ["join"],
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
        let player = client.player.get(message.guildId);
        if(player && player.voiceChannel && player.state === "CONNECTED") {
            return await oops(message.channel, `I'm already connected to <#${player.voiceChannel}> voice channel!`, color)
        } else {
            if(!message.member.voice.channel) return await oops(message.channel, `You are not connected to a voice channel to use this command.`, color);

            if(!message.guild.me.permissions.has([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK])) return await oops(message.channel, `I don't have enough permissions to execute this command.`, color);

            player = client.player.create({ guild: message.guildId, textChannel: message.channelId, voiceChannel: message.member.voice.channelId, selfDeafen: true, volume: 80 });

            if(player && player.state !== "CONNECTED") player.connect();

            return await msgReply(message, `Joined <#${message.member.voice.channelId}>`, color);
        };
    }
}