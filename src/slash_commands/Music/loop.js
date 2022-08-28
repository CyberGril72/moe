const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const { intReply, intCheck } = require("../../handlers/functions");

module.exports = {
    data: {
        name: "loop",
        description: "To loop/repeat a track or the whole queue.",
        options: [
            {
                name: "input",
                description: "The looping input (track or queue).",
                type: "STRING",
                required: true,
                choices: [
                    {
                        name: "track",
                        value: "track"
                    },
                    {
                        name: "queue",
                        value: "queue"
                    }
                ]
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
        if(!interaction.replied) await interaction.deferReply({ ephemeral: true }).catch(() => {});
        const input = interaction.options.getString("input");
        if(!input) return;

        let check = await intCheck(interaction, Permissions.FLAGS.DEAFEN_MEMBERS)
        if(!check) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

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

        if(input === "track") {
            if(player.trackRepeat) {
                player.setTrackRepeat(false);
                return await intReply(interaction, `Player track repeat/loop is now disabled.`, color);
            } else {
                player.setTrackRepeat(true);
                return await intReply(interaction, `Player track repeat/loop is now enabled.`, color);
            };
        } else if(input === "queue") {
            if(!player.queue.size) return await intReply(interaction, `No more songs left in the queue to repeat/loop.`, color);

            if(player.queueRepeat) {
                player.setQueueRepeat(false);
                return await intReply(interaction, `Player queue repeat/loop is now disabled.`, color);
            } else {
                player.setQueueRepeat(true);
                return await intReply(interaction, `Player queue repeat/loop is now enabled.`, color)
            };
        } else return await intReply(interaction, `Please provide a valid input (track/queue).`, color);
    }
}