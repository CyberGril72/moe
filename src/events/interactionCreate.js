const Client = require("../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const db = require("../utils/schemas/setup");

module.exports = {
    name: "interactionCreate",

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     */

    execute: async (client, interaction) => {
        let color = client.config.color ? client.config.color : "BLURPLE";
        if(interaction.inGuild() && interaction.isCommand()) {
            const { commandName } = interaction;
            if(!commandName) return await interaction.followUp({ content: "Unknow interaction!" }).catch(() => {});

            let command = client.slash_commands.get(commandName);
            if(!command) return;

            if(!interaction.guild.me.permissions.has([Permissions.FLAGS.EMBED_LINKS, Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.USE_APPLICATION_COMMANDS])) return await interaction.followUp({ content: "I don't have enough permission to execute this command.", ephemeral: true }).catch(() => {});
            
            try {

                if(command.execute) return await command.execute(client, interaction, color);

            } catch (error) {
                console.error(error);
                if(interaction.replied) {
                    await interaction.editReply({
                        ephemeral: true,
                        content: `An unexpected error occured, the developers have been notified.`
                    }).catch(() => {});
                } else {
                    await interaction.followUp({
                        ephemeral: true,
                        content: `An unexpected error occured, the developers have been notified.`
                    }).catch(() => {});
                };
            };
        };
        
        if(interaction.isButton()) {
            let data = await db.findOne({ _id: interaction.guildId });
            if(data && interaction.channelId === data.channel && interaction.message.id === data.message) return client.emit("playerButtons", interaction, data, color);
        };
    }
}