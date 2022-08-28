const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { msgReply, oops, moveArray } = require("../../handlers/functions")

module.exports = {
    name: "playprevious",
    description: "Plays the previously played track.",
    cooldown: 5,
    dev: false,
    usage: "",
    aliases: ["pp"],
    category: "Music",
    examples: ["playprevious"],
    sub_commands: [],
    args: false,
    player: { active: false, voice: true, dj: true, djPerm: Permissions.FLAGS.DEAFEN_MEMBERS },
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
        if(!message.member.voice.channel) return await oops(message, `You are not connected to a voice channel to use this command.`, color);

        const player = client.player.get(message.guildId);
        if(!player) return await oops(message.channel, `Nothing is playing right now!`, color);
        if(!player.queue) return await oops(message.channel, `Nothing is playing right now!`, color);
        if(!player.queue.previous) return await oops(message.channel, `No previously played track found!`, color);

        if(player.state !== "CONNECTED") player.connect();
        player.queue.add(player.queue.previous);

        if(!player.queue.size) {
            if(player.queue.current) player.stop();
            if(player && player.state === "CONNECTED" && !player.playing && !player.paused) await player.play();

            return await msgReply(message, `Added [${player.queue.previous.title}](${player.queue.previous.uri}) to the queue.`, color);
        } else {
            if(player.queue.size === 1) {
                if(player.queue.current) player.stop();
                if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                return await msgReply(message, `Added [${player.queue.previous.title}](${player.queue.previous.uri}) to the queue.`, color);
            } else {
                const move = moveArray(player.queue, player.queue.length - 1, 0);
                player.queue.clear();
                player.queue.add(move);
                player.stop();

                return await msgReply(message, `Added [${player.queue.previous.title}](${player.queue.previous.uri}) to the queue.`, color);
            };
        };
    }
}