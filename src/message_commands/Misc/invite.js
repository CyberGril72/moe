const { Message, MessageActionRow } = require("discord.js");
const Client = require("../../../index");

module.exports = {
    name: "invite",
    description: "To invite me to your server.",
    cooldown: 0,
    dev: false,
    usage: "",
    aliases: ["add"],
    category: "Misc",
    examples: ["invite"],
    sub_commands: [],
    args: false,
    player: { active: false, voice: false, dj: false, djPerm: null },
    permissions: {
        client: [],
        author: []
    },

    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {Any[]} args
     * @param {String} prefix
     * @param {String} color
     */

    execute: async (client, message, args, prefix, color) => {
        const embed1 = client.embed().setColor(color).setDescription(`[Invite me](${client.config.links.invite}) to your server now and join the [support server](${client.config.links.server}).`).setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        const inv = client.button().setLabel("Invite").setURL(client.config.links.invite).setStyle("LINK");

        const sup = client.button().setLabel("Support Server").setURL(client.config.links.server).setStyle("LINK");

        const inv2 = client.button().setLabel("Invite OxyPrime").setURL(client.config.links.invite2).setStyle("LINK");

        return await message.reply({ embeds: [embed1], components: [new MessageActionRow().addComponents(inv,inv2, sup)] }).catch(() => { });
    }
}
