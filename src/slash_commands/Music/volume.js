const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const { intCheck, intReply } = require("../../handlers/functions");

module.exports = {
    data: {
        name: "volume",
        description: "To see/change the volume of the player.",
        options: [
            {
                name: "amount",
                description: "The volume amount.",
                type: "NUMBER",
                required: false
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

        let amount = interaction.options.getNumber("amount");
        if(amount) {
            if(!check) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

            if(amount < 10) return await intReply(interaction, `Volume amount shouldn't be less than 10.`, color);
            if(amount > 200) return await intReply(interaction, `Volume amount shouldn't be more than 200.`, color);

            if(player.volume === amount) return await intReply(interaction, `Volume amount is already at ${player.volume}`, color);

            player.setVolume(amount);

            return await intReply(interaction, `Volume amount set to \`[ ${player.volume}% ]\``, color);
        } else {
            return await intReply(interaction, `Current player volume: \`[ ${player.volume}% ]\``, color);
        };
    }
}