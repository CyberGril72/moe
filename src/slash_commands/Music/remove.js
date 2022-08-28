const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const { intReply, intCheck } = require("../../handlers/functions");

module.exports = {
    data: {
        name: "remove",
        description: "To remove dupes/tracks from th queue.",
        options: [
            {
                name: "track",
                description: "To remove a track from the queue.",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "number",
                        description: "The track number.",
                        type: "NUMBER",
                        required: true
                    }
                ]
            },

            {
                name: "dupes",
                description: "To remove dupes from the queue.",
                type: "SUB_COMMAND"
            }
        ]
    },

    dj: true,

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {String} color 
     */

    execute: async (client, interaction, color) => {
        if(!interaction.replied) await interaction.deferReply().catch(() => {});
        let check = await intCheck(interaction, Permissions.FLAGS.DEAFEN_MEMBERS)
        if(check !== true) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

        if(!interaction.member.voice.channel) return await intReply(interaction, "You are not connected to  a voice channel to use this command.", color);

        let player = client.player.get(interaction.guildId);
        if(!player) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue.current) return await intReply(interaction, `Nothing is playing right now.`, color);

        if(player && player.state !== "CONNECTED") {
            player.destroy();
            return await intReply(interaction, `Nothing is playing right now.`, color);
        };

        if(interaction.guild.me.voice.channel && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) return await intReply(interaction, `You are to connected to ${interaction.guild.me.voice.channel} to use this command.`, color);

        if(!player.queue.size) return await intReply(interaction, `Don't have enough songs left in the queue to remove.`, color);

        if(interaction.options.getSubcommand() === "track") {
            const trackNumber = interaction.options.getNumber("number");
            if(!trackNumber) return await intReply(interaction, `Please provide a track number to remove.`, color);

            let removetrackNumber = trackNumber - 1;
            if(removetrackNumber < 0 || removetrackNumber >= player.queue.size) return await intReply(interaction, `You've provided an invalid track number to remove.`, color);

            player.queue.splice(removetrackNumber, 1);
            return await intReply(interaction, `Removed track number \`[ ${trackNumber} ]\` from the queue.`, color);
        } else if(interaction.options.getSubcommand() === "dupes") {
            let count = 0;
            let dump = [];

            for (const track of player.queue) {
                if(dump.length <= 0) dump.push(track);
                else {
                    let e = dump.find((x) => x.title === track.title || x.uri === track.uri);
                    if(!e) dump.push(track);
                    else ++count;
                };
            };

            if(count <= 0) return await intReply(interaction, `No duplicated tracks found in the queue to remove.`, color);

            player.queue.clear();
            player.queue.add(dump);

            return await intReply(interaction, `Removed \`[ ${count} ]\` duplicated tracks from the queue.`, color);
        };
    }
}