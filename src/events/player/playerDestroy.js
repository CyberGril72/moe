const { MessageEmbed, MessageButton, MessageActionRow, MessageAttachment } = require("discord.js");
const { Player } = require("erela.js");
const db = require("../../utils/schemas/setup");
const db2 = require("../../utils/schemas/247");
const Client = require("../../../index");
const { join } = require("path");

module.exports = {
    name: "playerDestroy",

    /**
     * 
     * @param {Client} client 
     * @param {Player} player 
     */

    execute: async (client, player) => {
        const color = client.config.color ? client.config.color : "BLURPLE";
        const guild = client.guilds.cache.get(player.guild);
        if (!guild) return;

        console.log(`[ LAVALINK NODE ${player.node.options.identifier} PLAYER DESTROYED ]`);
        console.log(`[ GUILD NAME: ${guild.name} ]`);
        console.log(`[ GUILD ID: ${guild.id} ]`);

        let data = await db.findOne({ _id: guild.id });
        let data2 = await db2.findOne({ _id: guild.id });
        if (!data) return;

        let channel = guild.channels.cache.get(data.channel);
        if (!channel) return;

        if (data2 && data2.mode) {
            let vc = guild.channels.cache.get(data2.voiceChannel);
            if (vc) {
                player = client.player.create({
                    guild: guild.id,
                    textChannel: channel.id,
                    voiceChannel: vc.id,
                    selfDeafen: true,
                    volume: 80
                });

                if (player.state !== "CONNECTED") player.connect();
            };
        };

        let message;

        try {
            message = await channel.messages.fetch(data.message, { cache: true });
        } catch (error) { };

        if (!message) return;

        let disabled = true;
        if (player && player.queue && player.queue.current) disabled = false;

        let embed1 = new MessageEmbed().setColor(color).setTitle("Nothing playing right now").setDescription(`[Invite](${client.config.links.invite}) ~ [Support Server](${client.config.links.server})`).setFooter({ text: `Thanks for using ${client.user.username}`, iconURL: client.user.displayAvatarURL() }).setImage(client.config.links.image);

        let pausebut = new MessageButton().setCustomId(`pause_but_${message.guildId}`).setEmoji("⏯️").setStyle("SECONDARY").setDisabled(disabled);

        let lowvolumebut = new MessageButton().setCustomId(`lowvolume_but_${message.guildId}`).setEmoji("🔉").setStyle("SECONDARY").setDisabled(disabled);

        let highvolumebut = new MessageButton().setCustomId(`highvolume_but_${message.guildId}`).setEmoji("🔊").setStyle("SECONDARY").setDisabled(disabled);

        let previousbut = new MessageButton().setCustomId(`previous_but_${message.guildId}`).setEmoji("⏮️").setStyle("SECONDARY").setDisabled(disabled);

        let skipbut = new MessageButton().setCustomId(`skipbut_but_${message.guildId}`).setEmoji("⏭️").setStyle("SECONDARY").setDisabled(disabled);

        let rewindbut = new MessageButton().setCustomId(`rewindbut_but_${message.guildId}`).setEmoji("⏪").setStyle("SECONDARY").setDisabled(disabled);

        let forwardbut = new MessageButton().setCustomId(`forward_but_${message.guildId}`).setEmoji("⏩").setStyle("SECONDARY").setDisabled(disabled);

        let toggleautoplaybut = new MessageButton().setCustomId(`autoplay_but_${message.guildId}`).setEmoji("♾️").setStyle("SECONDARY").setDisabled(disabled);

        let loopmodesbut = new MessageButton().setCustomId(`loopmodesbut_but_${message.guildId}`).setEmoji("🔁").setStyle("SECONDARY").setDisabled(disabled);

        let stopbut = new MessageButton().setCustomId(`stop_but_${message.guildId}`).setEmoji("⏹️").setStyle("SECONDARY").setDisabled(disabled);

        const row1 = new MessageActionRow().addComponents([lowvolumebut, previousbut, pausebut, skipbut, highvolumebut]);

        const row2 = new MessageActionRow().addComponents([rewindbut, toggleautoplaybut, stopbut, loopmodesbut, forwardbut]);

        await message.edit({
            content: "__**Join a voice channel and queue songs by name/url**__\n\n",
            embeds: [embed1],
            components: [row1, row2]
        });
    }
}