const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const { intCheck, intReply } = require("../../handlers/functions");

module.exports = {
    data: {
        name: "pitch",
        description: "To change/set the pitch of the player.",
        options: [
            {
                name: "value",
                description: "The pitch value.",
                type: "STRING",
                required: true,
                choices: [
                    {
                        name: "1",
                        value: "1"
                    },

                    {
                        name: "2",
                        value: "2"
                    },

                    {
                        name: "3",
                        value: "3"
                    },

                    {
                        name: "reset",
                        value: "reset"
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

        const value = interaction.options.getString("value");

        if(value === "1") {
            if(player.pitchAmount === 1) return await intReply(interaction, `The player's pitch is already at \`[ ${value}x ]\``, color);

            player.setPitch(1);
            return await intReply(interaction, `Player's pitch set to \`[ ${value}x ]\``, color);
        } else if(value === "2") {
            if(player.pitchAmount === 2) return await intReply(interaction, `The player's pitch is already at \`[ ${value}x ]\``, color);

            player.setPitch(2);
            return await intReply(interaction, `Player's pitch set to \`[ ${value}x ]\``, color);
        } else if(value === "3") {
            if(player.pitchAmount === 3) return await intReply(interaction, `The player's pitch is already at \`[ ${value}x ]\``, color);

            player.setPitch(3);
            return await intReply(interaction, `Player's pitch set to \`[ ${value}x ]\``, color);
        } else if(value === "reset") {
            if(player.pitchAmount === 1) return await intReply(interaction, `The player's pitch is already at the normal range.`, color);

            player.setPitch(1);
            return await intReply(interaction, `Player's pitch reset to normal ~ \`[ 1x ]\``, color);
        };
    }
}