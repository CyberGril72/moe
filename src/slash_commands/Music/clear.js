const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const { intCheck, intReply } = require("../../handlers/functions");

module.exports = {
    data: {
        name: "clear",
        description: "To clear the server queue/filters.",
        options: [
            {
                name: "input",
                description: "The clear input.",
                type: "STRING",
                required: true,
                choices: [
                    {
                        name: "queue",
                        value: "queue"
                    },

                    {
                        name: "filters",
                        value: "filters"
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
        if(!interaction.replied) await interaction.deferReply().catch(() => {});
        let check = await intCheck(interaction, Permissions.FLAGS.DEAFEN_MEMBERS);
        if(check !== true) return await intReply(interaction, `You don't have enough permission to execute this command.`, color);

        if(!interaction.member.voice.channel) return await intReply(interaction, `You are not connected to a voice channel to use this command.`, color);

        const player = client.player.get(interaction.guildId);
        if(!player) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue.current) return await intReply(interaction, `Nothing is playing right now.`, color);

        if(player && player.state !== "CONNECTED") {
            player.destroy();
            return await intReply(interaction, `Nothing is playing right now.`, color);
        };

        if(interaction.guild.me.voice.channel && interaction.guild.me.voice.channelId !== interaction.member.voice.channelId) return await intReply(interaction, `You are not connected to ${interaction.guild.me.voice.channel} to use this command.`, color);

        const input = interaction.options.getString("input");
        if(input === "queue") {
            if(!player.queue.size) return await  intReply(interaction, `No more songs left in the queue to clear.`, color);

            player.queue.clear();
            return await intReply(interaction, `Player queue is now cleared.`, color);
        } else if(input === "filters") {
            if(!player.filters) return await intReply(interaction, `No filters are applied to clear.`, color);

            player.clearFilters();
            return await intReply(interaction, `Player filters is now cleared.`, color);
        }
    }
}