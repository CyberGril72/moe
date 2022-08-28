const Client = require("../../../index");
const { MessageButton, MessageActionRow } = require("discord.js");
const { Player } = require("erela.js");
const db = require("../../utils/schemas/setup");

module.exports = {
    name: "playerCreate",

    /**
     * 
     * @param {Client} client 
     * @param {Player} player 
     */

    execute: async (client, player) => {
        let guild = client.guilds.cache.get(player.guild);
        if(!guild) return;

        console.log(`[ LAVALINK NODE ${player.node.options.identifier} PLAYER CREATED ]`);
        console.log(`[ GUILD NAME: ${guild.name} ]`);
        console.log(`[ GUILD ID: ${guild.id} ]`);

        const data = await db.findOne({ _id: guild.id });
        if(!data) return;

        let channel = guild.channels.cache.get(data.channel);
        if(!channel) return;

        let message;

        try {

            message = await channel.messages.fetch(data.message, { cache: true });

        } catch (e) {};

        if(!message) return;

        let pausebut = new MessageButton().setCustomId(`pause_but_${guild.id}`).setEmoji("⏯️").setStyle("SECONDARY").setDisabled(false);

        let lowvolumebut = new MessageButton().setCustomId(`lowvolume_but_${guild.id}`).setEmoji("🔉").setStyle("SECONDARY").setDisabled(false);

        let highvolumebut = new MessageButton().setCustomId(`highvolume_but_${guild.id}`).setEmoji("🔊").setStyle("SECONDARY").setDisabled(false);

        let previousbut = new MessageButton().setCustomId(`previous_but_${guild.id}`).setEmoji("⏮️").setStyle("SECONDARY").setDisabled(false);

        let skipbut = new MessageButton().setCustomId(`skipbut_but_${guild.id}`).setEmoji("⏭️").setStyle("SECONDARY").setDisabled(false);

        let rewindbut = new MessageButton().setCustomId(`rewindbut_but_${guild.id}`).setEmoji("⏪").setStyle("SECONDARY").setDisabled(false);

        let forwardbut = new MessageButton().setCustomId(`forward_but_${guild.id}`).setEmoji("⏩").setStyle("SECONDARY").setDisabled(false);

        let toggleautoplaybut = new MessageButton().setCustomId(`autoplay_but_${guild.id}`).setEmoji("♾️").setStyle("SECONDARY").setDisabled(false);

        let loopmodesbut = new MessageButton().setCustomId(`loopmodesbut_but_${guild.id}`).setEmoji("🔁").setStyle("SECONDARY").setDisabled(false);

        let stopbut = new MessageButton().setCustomId(`stop_but_${guild.id}`).setEmoji("⏹️").setStyle("SECONDARY").setDisabled(false);

        const row1 = new MessageActionRow().addComponents([lowvolumebut, previousbut, pausebut, skipbut, highvolumebut]);

        const row2 = new MessageActionRow().addComponents([rewindbut, toggleautoplaybut, stopbut, loopmodesbut, forwardbut]);

        await message.edit({ content: "__**Join a voice channel and queue songs by name/url.**__\n\n", components: [row1, row2] }).catch(() => {});
    }
}