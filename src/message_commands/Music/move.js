const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { oops, good, msgReply, invalidArgs, moveArray } = require("../../handlers/functions")

module.exports = {
    name: "move",
    description: "To move track/bot/you to a position.",
    cooldown: 3,
    dev: false,
    usage: "<sub_command>",
    aliases: [],
    category: "Music",
    examples: ["move track 4 1", "move me", "move bot"],
    sub_commands: ["track <number> <position>", "me", "bot"],
    args: false,
    player: { active: false, voice: false, dj: true, djPerm: Permissions.FLAGS.DEAFEN_MEMBERS },
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
        if(!message.member.voice.channel) return await oops(message.channel, `You are not connected to a voice to use this command.`, color);

        const player = client.player.get(message.guildId);
        if(!player) return await oops(message.channel, `Nothing is playing right now!`, color);

        if(["track", "t", "song", "s"].includes(args[0])) {
            if(message.guild.me.voice.channel && message.guild.me.voice.channelId !== message.member.voice.channelId) return await oops(message.channel, `You are not connected to <#${message.guild.me.voice.channelId}> to use this command!`, color);

            if(!player.queue) return await oops(message.channel, `Nothing is playing right now!`, color);
            if(!player.queue.current) return await oops(message.channel, `Nothing is playing right now!`, color);
            if(!player.queue.size) return await oops(message.channel, `Don't have enough tracks left in the queue to move.`, color);

            if(!args[1]) return await oops(message.channel, `Please provide the track number to move.`, color);
            if(!args[2]) return await oops(message.channel, `Please provide a to position to move the track.`, color);

            let trackNumber = parseInt(args[1]);
            let toPosition = parseInt(args[2]);

            if(isNaN(trackNumber)) return await oops(message.channel, `Track number must be a valid number.`, color);
            if(isNaN(toPosition)) return await oops(message.channel, `To positon must be a valid number.`, color);
            if(trackNumber <= 0) return await oops(message.channel, `Track number shouldn't be lower than or equal to 0.`, color);
            if(trackNumber > player.queue.size) return await oops(message.channel, `Track number shouldn't be higher than the queue's tracks length.`, color);
            if(toPosition > player.queue.size) return await oops(message.channel, `To positon shouldn't be higher than the queue's tracks length.`, color);
            if(toPosition <= 0) return await oops(message.channel, `To position shouldn't be lower than or equal to 0.`, color);
            if(trackNumber === toPosition) return await oops(message.channel, `The track number you've provided is already at this position.`, color);

            const move = moveArray(player.queue, trackNumber - 1, toPosition - 1);
            player.queue.clear();
            player.queue.add(move);

            return await msgReply(message, `Moved track number \`[ ${trackNumber} ]\` to \`[ ${toPosition} ]\` in the queue.`, color);
        } else if(["me", "m"].includes(args[0])) {
            if(message.member.voice.channel && message.member.voice.channelId === message.guild.me.voice.channelId) return await oops(message.channel, `You are already connected to the same channel as I am.`, color);

            if(!message.guild.me.permissions.has(Permissions.FLAGS.MOVE_MEMBERS)) return await oops(message.channel, `I don't have \`MOVE_MEMBERS\` permission to execute this command.`, color);

            await message.member.voice.setChannel(message.guild.me.voice.channel);
            return await msgReply(message, `Moved you to ${message.guild.me.voice.channel}`, color);
        } else if(["bot", "b"].includes(args[0])) {
            if(!message.member.permissions.has(Permissions.FLAGS.MOVE_MEMBERS)) return await oops(message.channel, `You don't have \`MOVE_MEMBERS\` permission to execute this command.`, color);
            
            if(message.guild.me.voice.channel && message.guild.me.voice.channelId === message.member.voice.channelId) return await oops(message.channel, `I'm already connected to the same channel as you are!`, color);

            player.setVoiceChannel(message.member.voice.channelId);
            if(player.voiceChannel !== message.member.voice.channelId) player.changeVoiceChannel(message.member.voice.channelId);
            if(player.paused) player.pause(false);

            return await msgReply(message, `Moved me to <#${player.voiceChannel}>`, color);
        } else return await invalidArgs("move", message, "Please provide a valid sub command.", client);
    }
}