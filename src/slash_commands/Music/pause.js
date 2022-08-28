const Client = require("../../../index");
const { CommandInteraction, Permissions, CommandInteractionOptionResolver, MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { intReply, intCheck } = require("../../handlers/functions");

module.exports = {
    data: {
        name: "pause",
        description: "To pause the player."
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
        let check = await intCheck(interaction, Permissions.FLAGS.DEAFEN_MEMBERS)
        if(check !== true) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

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

        if(player.paused) {
            let embed1 = new MessageEmbed().setColor(color).setDescription(`[**__${player.queue.current.title}__**](${player.queue.current.uri}) is currently paused.`);

            let resumebut = new MessageButton().setCustomId("_pause_resume_button_").setEmoji("▶️").setStyle("SECONDARY");

            let row1 = new MessageActionRow().addComponents(resumebut);

            await interaction.editReply({
                embeds: [embed1],
                components: [row1]
            }).catch(() => {});

            const collector = interaction.channel.createMessageComponentCollector({
                filter: (b) => {
                    if(b.user.id === interaction.user.id && b.member.voice.channel) return true;
                    else {
                        b.deferUpdate().catch(() => {});
                        return false;
                    };
                },
                max: 1,
                time: 30e3
            });

            collector.on("end", async () => {
                await interaction.editReply({
                    components: [new MessageActionRow().addComponents(resumebut.setDisabled(true).setEmoji("⏸️"))]
                }).catch(() => {});
            });

            collector.on("collect", async (button) => {
                if(button.customId === resumebut.customId) {
                    if(!button.replied) await button.deferReply({ ephemeral: true }).catch(() => {});
                    if(player.paused) {
                        player.pause(false);
                        return await button.editReply({
                            embeds: [new MessageEmbed().setColor(color).setDescription(`[**__${player.queue.current.title}__**](${player.queue.current.uri}) is now resumed/unpaused.`)]
                        }).catch(() => {});
                    } else return await button.editReply({
                        embeds: [client.embed().setColor(color).setDescription(`[**__${player.queue.current.title}__**](${player.queue.current.uri}) is already resumed.`)]
                    }).catch(() => {});
                } else return;
            });
        } else {
            player.pause(true);
            return await interaction.editReply({
                embeds: [client.embed().setColor(color).setDescription(`[**__${player.queue.current.title}__**](${player.queue.current.uri}) is now paused.`)]
            }).catch(() => {});
        };
    }
}