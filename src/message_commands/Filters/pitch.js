const { Message, Permissions, MessageActionRow } = require("discord.js");
const Client = require("../../../index");
const { msgReply, oops, intReply } = require("../../handlers/functions")

module.exports = {
    name: "pitch",
    description: "To change the pitch of the current playing song.",
    cooldown: 3,
    dev: false,
    usage: "<value>",
    aliases: [],
    category: "Filters",
    examples: ["pitch 1", "pitch 2", "pitch 3", "pitch reset"],
    sub_commands: [],
    args: false,
    player: { active: true, voice: true, dj: true, djPerm: Permissions.FLAGS.DEAFEN_MEMBERS },
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
        const player = client.player.get(message.guildId);

        if(args.length) {
            if(["reset", "r"].includes(args[0])) {
                player.setPitch(1);
                return await msgReply(message, `Pitch set to default \`[ ${player.pitchAmount}x ]\``, color);
            } else {
                let value = parseInt(args[0]);
                if(isNaN(value)) return await oops(message.channel, `Please provide a valid number, 1, 2, or 3.`, color);

                if(value <= 0 || value > 3) return await oops(message.channel, `Please provide a valid number, 1, 2 or 3.`, color);

                player.setPitch(value);
                return await msgReply(message, `Pitch set to \`[ ${player.pitchAmount}x ]\``, color);
            };
        } else {
            const embed1 = client.embed().setColor(color).setDescription(`Select the pitch value that you want.`);

            const one = client.button().setCustomId("pitch_button_1").setLabel("1x").setStyle("PRIMARY");
            const two = client.button().setCustomId("pitch_button_2").setLabel("2x").setStyle("PRIMARY");
            const three = client.button().setCustomId("pitch_button_3").setLabel("3x").setStyle("PRIMARY");
            const reset = client.button().setCustomId("pitch_button_reset").setLabel("Reset").setStyle("PRIMARY");

            if(player.pitchAmount === 1) one.setDisabled(true);
            else if(player.pitchAmount === 2) two.setDisabled(true);
            else if(player.pitchAmount === 3) three.setDisabled(true);
            else if(player.pitchAmount === 0) reset.setDisabled(true);

            const m = await message.reply({ embeds: [embed1], components: [new MessageActionRow().addComponents(one, two, three, reset)] });

            const collector = m.createMessageComponentCollector({
                filter: (b) => b.user.id === message.author.id ? true : false && b.deferUpdate().catch(() => {}),
                max: 4,
                time: 60000,
                idle: 60000/2
            });

            collector.on("end", async () => {
                if(!m) return;
                await m.edit({ components: [new MessageActionRow().addComponents(one.setDisabled(true), two.setDisabled(true), three.setDisabled(true), reset.setDisabled(true))] }).catch(() => {});
            });

            collector.on("collect", async (button) => {
                if(!button.replied) await button.deferReply({ ephemeral: true }).catch(() => {});
                if(!player) return await intReply(button, `Nothing is playing right now to set bassboost level.`, color);
                if(!player.queue) return await intReply(button, `Nothing is playing right now to set bassboost level.`, color);
                if(!player.queue.current) return await intReply(button, `Nothing is playing right now to set bassboost level.`, color);

                if(button.customId === one.customId) {
                    player.setPitch(1);

                    one.setDisabled(true);
                    two.setDisabled(false);
                    three.setDisabled(false);
                    reset.setDisabled(true);

                    if(m) await m.edit({ components: [new MessageActionRow().addComponents(one, two, three, reset)] }).catch(() => {});

                    return await intReply(button, `Pitch set to \`[ ${player.pitchAmount}x ]\``, color);
                } else if(button.customId === two.customId) {
                    player.setPitch(2);

                    one.setDisabled(false);
                    two.setDisabled(true);
                    three.setDisabled(false);
                    reset.setDisabled(false);

                    if(m) await m.edit({ components: [new MessageActionRow().addComponents(one, two, three, reset)] }).catch(() => {});

                    return await intReply(button, `Pitch set to \`[ ${player.pitchAmount}x ]\``, color);
                } else if(button.customId === three.customId) {
                    player.setPitch(3);

                    one.setDisabled(false);
                    two.setDisabled(false);
                    three.setDisabled(true);
                    reset.setDisabled(false);

                    if(m) await m.edit({ components: [new MessageActionRow().addComponents(one, two, three, reset)] }).catch(() => {});

                    return await intReply(button, `Pitch set to \`[ ${player.pitchAmount}x ]\``, color);
                } else if(button.customId === reset.customId) {
                    player.setPitch(1);

                    one.setDisabled(true);
                    two.setDisabled(false);
                    three.setDisabled(false);
                    reset.setDisabled(true);

                    if(m) await m.edit({ components: [new MessageActionRow().addComponents(one, two, three, reset)] }).catch(() => {});

                    return await intReply(button, `Pitch set to default \`[ ${player.pitchAmount}x ]\``, color);
                } else return;
            });
        };
    }
}