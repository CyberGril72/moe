const { CommandInteraction, MessageActionRow, MessageButton } = require("discord.js");
const Client = require("../../../index");
const lodash = require("lodash");

module.exports = {
    data: {
        name: "commands",
        description: "To see all my slash commands."
    },

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {String} color 
     */

    execute: async (client, interaction, color) => {
        if(!interaction.replied) await interaction.deferReply().catch(() => {});

        const prefix = "/";
        const commands = client.slash_commands.map((x) => `> \`${prefix}${x.data.name}\`: ${x.data.description}`);
        const pages = lodash.chunk(commands, 10).map((x) => x.join("\n"));
        let page = 0;

        let previousbut = new MessageButton().setCustomId("previous_but_/commands_cmd").setEmoji("⬅️").setStyle("SECONDARY");
        let nextbut = new MessageButton().setCustomId("nextbut_but_/commands_cmd").setEmoji("➡️").setStyle("SECONDARY");
        let stopbut = new MessageButton().setCustomId("stop_but_/commands_cmd").setEmoji("⏹️").setStyle("SECONDARY");

        let embed1 = client.embed().setColor(color).setAuthor({name: client.user.username,iconURL: client.user.displayAvatarURL()}).setTitle("Slash Commands List(s)").setFooter({text: `Page ${page + 1} of ${pages.length}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true })}).setDescription(`**Total commands:** \`[ ${commands.length} ]\`\n\n${pages[page]}\n\n*Note: To get more extended view/info of these commands, do \`/help <command_name>\`*`);

        await interaction.editReply({
            embeds: [embed1],
            components: [new MessageActionRow().addComponents(previousbut, stopbut, nextbut)]
        }).catch(() => {});

        const collector = interaction.channel.createMessageComponentCollector({
            filter: (b) => b.user.id === interaction.user.id ? true : false && b.deferUpdate().catch(() => {}),
            time: 60000*3,
            idle: 60000
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: [new MessageActionRow().addComponents(previousbut.setDisabled(true), stopbut.setDisabled(true), nextbut.setDisabled(true))] }).catch(() => {});
        });

        collector.on("collect", async (button) => {
            if(!button.deferred) await button.deferUpdate().catch(() => {});
            if(button.customId === previousbut.customId) {
                page = page - 1 < 0 ? pages.length - 1 : --page;
                embed1.setDescription(`**Total commands:** \`[ ${commands.length} ]\`\n\n${pages[page]}\n\n*Note: To get more extended view/info of these commands, do \`${prefix}help <command_name>\`*`).setFooter({text: `Page ${page + 1} of ${pages.length}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true })});

                await interaction.editReply({ embeds: [embed1] }).catch(() => {});
            } else if(button.customId === stopbut.customId) {
                return collector.stop();
            } else if(button.customId === nextbut.customId) {
                page = page + 1 > pages.length - 1 ? 0 : ++page;
                embed1.setDescription(`**Total commands:** \`[ ${commands.length} ]\`\n\n${pages[page]}\n\n*Note: To get more extended view/info of these commands, do \`${prefix}help <command_name>\`*`).setFooter({text: `Page ${page + 1} of ${pages.length}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true })});

                await interaction.editReply({ embeds: [embed1] }).catch(() => {});
            } else return;
        });
    }
}