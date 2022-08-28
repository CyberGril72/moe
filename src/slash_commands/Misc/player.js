const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const { intReply } = require("../../handlers/functions");
const setup = require("../../utils/schemas/setup");
const _247 = require("../../utils/schemas/247");
const announce = require("../../utils/schemas/announce");
const dj = require("../../utils/schemas/dj");
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    data: {
        name: "player",
        description: "Show the player details (read only).",
        options: [
            {
                name: "input",
                description: "Tha player details input.",
                type: "STRING",
                required: true,
                choices: [
                    {
                        name: "status",
                        value: "status"
                    },

                    {
                        name: "queue",
                        value: "queue"
                    },

                    {
                        name: "settings",
                        value: "settings"
                    }
                ]
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
        if(!interaction.replied) await interaction.deferReply().catch(() => {});
        const input = interaction.options.getString("input");
        if(!input) return await intReply(interaction, `Please provide an input, inorder procede this command.`, color);
        const player = client.player.get(interaction.guildId);

        switch(input) {
            case "status":
                await intReply(interaction, `Player Status: ${player ? "`[ online ]`" : "`[ offline ]`"}`, color);
                break;

            case "queue":
                await interaction.editReply({ embeds: [client.embed().setTitle("Player Queue Details").setColor(color).setDescription(`The player queue is currently ${player && player.queue ? "active." : "inactive."}`).addFields([
                    {
                        name: "Now playing",
                        value: `${player && player.queue && player.queue.current ? "Active" : "Inactive"}`,
                        inline: true
                    },

                    {
                        name: "Volume",
                        value: `\`[ ${player && player.volume ? player.volume : 0} ]\``,
                        inline: true
                    },

                    {
                        name: "Total Tracks",
                        value: `${player && player.queue && player.queue.size ? "`[ "+player.queue.size+" ]`" : "`[ 0 ]`"}`,
                        inline: true
                    },

                    {
                        name: "Total Duration",
                        value: `${player && player.queue && player.queue.duration ? "`[ "+prettyMilliseconds(Number(player.queue.duration))+" ]`" : "`[ 0 ]`"}`,
                        inline: true
                    },

                    {
                        name: "Track Loop",
                        value: `${player && player.trackRepeat ? "Enabled" : "Disabled"}`,
                        inline: true
                    },

                    {
                        name: "Queue Loop",
                        value: `${player && player.queueRepeat ? "Enabled" : "Disabled"}`,
                        inline: true
                    },

                    {
                        name: "Filters",
                        value: `${player && player.filters ? "Enabled" : "Disabled"}`,
                        inline: true
                    }
                ]).setFooter({text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true })})] }).catch(() => {});

                break;

            case "settings":
                let djdata = await dj.findOne({ _id: interaction.guildId });
                let announcedata = await announce.findOne({ _id: interaction.guildId });
                let setupdata = await setup.findOne({ _id: interaction.guildId });
                let _247data = await _247.findOne({ _id: interaction.guildId });

                await interaction.editReply({
                    embeds: [client.embed().setColor(color).setTitle(`Player Settings Details`).addFields([
                        {
                            name: "Setup",
                            value: setupdata ? "Enabled" : "Disabled",
                            inline: true
                        },

                        {
                            name: "Autoplay",
                            value: player && player.get("autoplay") ? "Enabled" : "Disabled",
                            inline: true
                        },

                        {
                            name: "Dj",
                            value: djdata && djdata.mode ? "Enabled" : "Disabled",
                            inline: true
                        },

                        {
                            name: "Announcing",
                            value: announcedata && announcedata.mode ? "Enabled" : "Disabled",
                            inline: true
                        },

                        {
                            name: "24/7",
                            value: _247data && _247data.mode ? "Enabled" : "Disabled",
                            inline: true
                        }
                    ]).setFooter({text: `Requested by ${interaction.user.username}`,iconURL: interaction.user.displayAvatarURL({ dynamic: true })})]
                }).catch(() => {});

                break;
        };
    }
}