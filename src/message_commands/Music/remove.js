const { Message, Permissions } = require("discord.js");
const Client = require("../../../index");
const { oops, good, invalidArgs, replyOops, msgReply } = require("../../handlers/functions")

module.exports = {
    name: "remove",
    description: "To remove tracks/dupes from the queue.",
    cooldown: 3,
    dev: false,
    usage: "<sub_command>",
    aliases: [],
    category: "Music",
    examples: ["remove track 5", "remove t 10", "remove song 5", "remove s 10", "remove user @Blacky", "remove u @Venom", "remove dupes", "remove d"],
    sub_commands: ["track <number>", "song <number>", "user <user>", "dupes"],
    args: true,
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

        if(["track", "t", "song", "s"].includes(args[0])) {
            if(!player.queue.size) return await oops(message.channel, `Don't have enough tracks left in the queue to remove.`, color);
            if(!args[1]) return await oops(message.channel, `Please provide the track number to remove.`, color);

            let trackNumber = parseInt(args[1]);
            if(isNaN(trackNumber)) return await oops(message.channel, `Please provide a valid track number to remove.`, color);
            
            if(trackNumber <= 0) return await oops(message.channel, `Track number shouldn't be lower than or equal to 0.`, color);
            if(trackNumber > player.queue.size) return await oops(message.channel, `Track shouldn't be higher than the queue's total tracks.`, color);

            player.queue.splice(trackNumber - 1, 1);
            return await good(message.channel, `Removed track number \`[ ${trackNumber} ]\` from the queue.`, color);
        } else if(["user", "u", "user_tracks", "ut"].includes(args[0])) {
            if(!player.queue.size) return await oops(message.channel, `Don't have enough tracks left in the queue to remove.`, color);

            if(!message.member.permissions.has(Permissions.FLAGS.MUTE_MEMBERS)) return await replyOops(message, `You don't have enough permissions to use this command.`, color);

            if(!args[1]) return await replyOops(message, `Please provide a user to remove the tracks from the queue that he requested.`, color);

            let member = message.mentions.members.first() || message.guild.members.cache.get(args[1]);

            let count = 0;
            let queue = [];

            for (const track of player.queue) {
                if(track.requester && track.requester.id !== member.user.id) {
                    queue.push(track);
                } else {
                    ++count;
                };
            };

            if(count <= 0) return await replyOops(message, `Couldn't find any tracks requested by <@${member.user.id}> in the queue.`, color);

            if(queue.length <= 0) {
                player.queue.clear();
                return await msgReply(message, `Removed \`[ ${count} ]\` track(s) requested by <@${member.user.id}> from the queue.`, color);
            };

            player.queue.clear();
            player.queue.add(queue);

            return await msgReply(message, `Removed \`[ ${count} ]\` track(s) requested by <@${member.user.id}> from the queue.`, color);
        } else if(["dupes", "dupe", "d"].includes(args[0])) {
            if(!player.queue.size) return await oops(message.channel, `Don't have enough tracks left in the queue to remove.`, color);

            const notDuplicatedTracks = [];
            let duplicatedTracksCount = 0;

            for (let i of player.queue) {
                if(notDuplicatedTracks.length <= 0) notDuplicatedTracks.push(i);
                else {
                    let j = notDuplicatedTracks.find((x) => x.title === i.title || x.uri === i.uri);
                    if(!j) notDuplicatedTracks.push(i);
                    else ++duplicatedTracksCount;
                };
            };

            if(duplicatedTracksCount <= 0) return await oops(message.channel, `Didn't find any duplicated tracks in the queue to remove.`, color);

            player.queue.clear();
            player.queue.add(notDuplicatedTracks);

            return await good(message.channel, `Removed \`[ ${duplicatedTracksCount} ]\` duplicated tracks from the queue.`, color);
        } else return await invalidArgs("remove", message, "Please provide a valid sub command.", client);
    }
}