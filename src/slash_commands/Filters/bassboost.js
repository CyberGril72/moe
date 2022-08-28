const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const { intCheck, intReply } = require("../../handlers/functions");

module.exports = {
    data: {
        name: "bassboost",
        description: "To set the bassboost level.",
        options: [
            {
                name: "level",
                description: "The bassboost level.",
                type: "STRING",
                required: true,
                choices: [
                    {
                        name: "none",
                        value: "none"
                    },

                    {
                        name: "low",
                        value: "low"
                    },

                    {
                        name: "medium",
                        value: "medium"
                    },

                    {
                        name: "high",
                        value: "high"
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

        const level = interaction.options.getString("level");

        switch(level) {
            case "none":
                if(player.bassboostLevel === level) return await intReply(interaction, `Bassboost level is already set to \`[ ${level} ]\``, color);

                player.setBassboost("none");
                await intReply(interaction, `Bassboost level is now set to \`[ ${level} ]\``, color);
                break;

            case "low":
                if(player.bassboostLevel === level) return await intReply(interaction, `Bassboost level is already set to \`[ ${level} ]\``, color);

                player.setBassboost("low");
                await intReply(interaction, `Bassboost level is now set to \`[ ${level} ]\``, color);
                break;

            case "medium":
                if(player.bassboostLevel === level) return await intReply(interaction, `Bassboost level is already set to \`[ ${level} ]\``, color);

                player.setBassboost("medium");
                await intReply(interaction, `Bassboost level is now set to \`[ ${level} ]\``, color);
                break;

            case "high":
                if(player.bassboostLevel === level) return await intReply(interaction, `Bassboost level is already set to \`[ ${level} ]\``, color);
                
                player.setBassboost("high");
                await intReply(interaction, `Bassboost level is now set to \`[ ${level} ]\``, color);
                break;
        };
    }
}