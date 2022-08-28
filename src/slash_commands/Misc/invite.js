const { CommandInteraction, MessageActionRow, MessageButton } = require("discord.js");
const Client = require("../../../index");

module.exports = {
    data: {
        name: "invite",
        description: "To invite me to your server."
    },

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {String} color 
     */

    execute: async (client, interaction, color) => {
        if(!interaction.replied) await interaction.deferReply().catch(() => {});
        const embed1 = client.embed().setColor(color).setDescription(`[Invite me](${client.config.links.invite}) to your server now and join the [support server](${client.config.links.server}).`).setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true }));

        const inv = new MessageButton().setLabel("Invite").setURL(client.config.links.invite).setStyle("LINK");

        const sup = new MessageButton().setLabel("Support Server").setURL(client.config.links.server).setStyle("LINK");
        const inv2 = client.button().setLabel("Invite OxyPrime").setURL(client.config.links.invite2).setStyle("LINK");

        return await interaction.editReply({ embeds: [embed1], components: [new MessageActionRow().addComponents(inv, inv2, sup)] }).catch(() => {});
    }
}
