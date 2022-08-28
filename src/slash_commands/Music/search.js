const { Client, CommandInteraction } = require("discord.js");
const { interactionSearchhandler } = require("../../handlers/functions");


module.exports = {
    data: {
        name: "search",
        description: "To search song from youtube/soundcloud.",
        options: [
            {
                name: "query",
                description: "The search query.",
                required: true,
                type: "STRING"
            }
        ]
    },

    dj: false,

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {String} color 
     */

    execute: async (client, interaction, color) => {
        await interaction.deferReply().catch(() => {});
        const query = interaction.options.getString("query");
        if(!query) return;
        let player = client.player.get(interaction.guildId);
        return await interactionSearchhandler(query, player, interaction, client, color);
    }
}