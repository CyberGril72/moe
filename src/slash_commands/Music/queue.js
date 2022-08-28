const { CommandInteraction } = require("discord.js");
const { interactionQueueHandler } = require("../../handlers/functions");
const Client = require("../../../index");

module.exports = {
    data: {
        name: "queue",
        description: "Shows the server queue.",
        options: [
            {
                name: "page",
                type: "NUMBER",
                required: false,
                description: "The queue page number."
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
        let page = interaction.options.getNumber("page");
        if(!page) page = 0;

        let player = client.player.get(interaction.guildId)
        return await interactionQueueHandler(player, page, interaction, color);
    }
}
