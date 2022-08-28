const Client = require("../../../index");
const { CommandInteraction, Permissions, MessageActionRow } = require("discord.js");
const { autoplay, intReply, intCheck } = require("../../handlers/functions");
const prettyMilliseconds = require("pretty-ms");
const db = require("../../utils/schemas/247");

module.exports = {
    data: {
        name: "voteskip",
        description: "To voteskip skip the current playing song.",
        options: [
            {
                name: "min_votes",
                description: "The minimum votes required to skip.",
                type: "NUMBER",
                required: false
            },

            {
                name: "max_votes",
                description: "The maximum votes required to skip.",
                type: "NUMBER",
                required: false
            },

            {
                name: "time",
                description: "The time required for voting.",
                type: "STRING",
                required: false,
                choices: [
                    {
                        name: "30s",
                        value: "30s"
                    },

                    {
                        name: "60s",
                        value: "60s"
                    },

                    {
                        name: "2m",
                        value: "2m"
                    },

                    {
                        name: "3m",
                        value: "3m"
                    },

                    {
                        name: "5m",
                        value: "5m"
                    }
                ]
            }
        ]
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
        let check = await intCheck(interaction, Permissions.FLAGS.MANAGE_MESSAGES);
        if(!check) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

        if(!interaction.member.voice.channel) return await intReply(interaction, "You are not connected to  a voice channel to use this command.", color);

        let player = client.player.get(interaction.guildId);
        if(!player) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue) return await intReply(interaction, `Nothing is playing right now.`, color);
        if(!player.queue.current) return await intReply(interaction, `Nothing is playing right now.`, color);

        if(player && player.state !== "CONNECTED") {
            player.destroy();
            return await intReply(interaction, `Nothing is playing right now.`, color);
        };

        if(!player.queue.size) return await intReply(interaction, `No more songs left in the queue to vote skip.`, color);

        if(interaction.guild.me.voice.channel && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) return await intReply(interaction, `You are to connected to ${interaction.guild.me.voice.channel} to use this command.`, color);

        if(interaction.guild.me.voice.channel.members.size <= 2) return await intReply(interaction, `Don't have enough peeps to conduct this vote skip.`, color);

        let min_votes = interaction.options.getNumber("min_votes");
        let max_votes = interaction.options.getNumber("max_votes");

        if(!min_votes) min_votes = Math.round(interaction.guild.me.voice.channel.members.size - 1/2);
        if(!max_votes) max_votes = Math.round(interaction.guild.me.voice.channel.members.size - 1/2);
        if(min_votes <= 0) min_votes = Math.round(interaction.guild.me.voice.channel.members.size - 1/2);
        if(min_votes >= max_votes) min_votes = max_votes;
        if(min_votes > interaction.guild.me.voice.channel.members.size) min_votes = Math.round(interaction.guild.me.voice.channel.members.size - 1/2);
        if(max_votes > interaction.guild.me.voice.channel.members.size) max_votes = interaction.guild.me.voice.channel.members.size - 1;
        if(max_votes <= 0) max_votes = Math.round(interaction.guild.me.voice.channel.members.size - 1/2);

        let time = interaction.options.getString("time");
        if(!time) time = 60000;
        switch(time) {
            case "30s":
                time = 30000;
                break;
            
            case "60s":
                time = 60000;
                break;

            case "2m":
                time = 60000*2;
                break;

            case "3m":
                time = 60000*3;
                break;

            case "5m":
                time = 60000*5;
                break;
        };

        let buttonE = client.button().setCustomId(`vote_skip_but_${interaction.guildId}`).setLabel("Vote").setStyle("PRIMARY");

        let embed1 = client.embed().setColor(color).setDescription(`A vote skip is being conducted by <@${interaction.user.id}>.`).setAuthor({name: interaction.user.tag,iconURL: interaction.user.displayAvatarURL({ dynamic: true })}).setTitle(`Vote Skip`).addField("Minimum Votes Required", `\`[ ${min_votes} ]\``, true).addField("Maximum Votes", `\`[ ${max_votes} ]\``, true).addField("Votes Count", `\`[ 0 ]\``, true).setFooter({text: `This vote skipping will end in ${prettyMilliseconds(Number(time))}`});

        await interaction.editReply({
            embeds: [embed1],
            components: [new MessageActionRow().addComponents(buttonE)]
        }).catch(() => {});

        const collector = interaction.channel.createMessageComponentCollector({
            filter: (b) => {
                if(b.member.voice.channel && b.member.voice.channelId === interaction.guild.me.voice.channelId && b.customId === buttonE.customId) return true;
                else {
                    b.deferUpdate().catch(() => {});
                    return false;
                };
            },
            time: time
        });

        const votersList = [];

        collector.on("end", async () => {
            if(interaction) await interaction.editReply({
                components: [new MessageActionRow().addComponents(buttonE.setDisabled(true))]
            }).catch(() => {});
            
            if(votersList.length >= max_votes) return;
            if(votersList.length >= min_votes) {
                if(!player) return await interaction.followUp({
                    embeds: [client.embed().setColor(color).setDescription(`The vote skipping has been canceled due to player not found.`)]
                }).catch(() => {});

                if(!player.queue) return await interaction.followUp({
                    embeds: [client.embed().setColor(color).setDescription(`The vote skipping has been canceled due to player not found.`)]
                }).catch(() => {});

                if(!player.queue.current) return await interaction.followUp({
                    embeds: [client.embed().setColor(color).setDescription(`The vote skipping has been canceled due to nothing is playing right now.`)]
                }).catch(() => {});

                const track = player.queue.current;

                if(!player.queue.size) {
                    let data = await db.findOne({ _id: interaction.guildId });
                    if(player.get("autoplay")) {
                        let au = await autoplay(player, client.user);
                        if(au === "failed") {
                            if(data && data.mode) {
                                player.stop();
                                await interaction.followUp({ embeds: [client.embed().setColor("BLURPLE").setDescription(`Vote Skipped [${track.title}](${track.uri})`)] }).catch(() => {});
                            } else {
                                player.destroy();
                                await interaction.followUp({ embeds: [client.embed().setColor("BLURPLE").setDescription(`Vote Skipped [${track.title}](${track.uri}) and destroyed the player due to no more songs left in the queue.`)] }).catch(() => {});
                            };
                        } else {
                            player.stop();
                            await interaction.followUp({ embeds: [client.embed().setColor(color).setDescription(`Vote Skipped [${track.title}](${track.uri})`)] })
                        };
                    } else {
                        if(data && data.mode) {
                            player.stop();
                            await interaction.followUp({ embeds: [client.embed().setColor("BLURPLE").setDescription(`Vote Skipped [${track.title}](${track.uri})`)] }).catch(() => {});
                        } else {
                            player.destroy();
                            await interaction.followUp({ embeds: [client.embed().setColor("BLURPLE").setDescription(`Vote Skipped [${track.title}](${track.uri}) and destroyed the player due no more songs left in the queue.`)] }).catch(() => {});
                        };
                    };
                } else {
                    player.stop();
                    await interaction.followUp({ embeds: [client.embed().setColor("BLURPLE").setDescription(`Vote Skipped [${track.title}](${track.uri})`, color)] }).catch(() => {});
                };
            };
        });

        collector.on("collect", async (button) => {
            if(!button.replied) await button.deferUpdate().catch(() => {});

            if(votersList.find((x) => x === button.user.id)) return;
            votersList.push(button.user.id);

            await interaction.editReply({
                embeds: [embed1.addField("Voters", `${votersList.map((x) => `<@${x}>`).join(", ")}`, true)]
            }).catch(() => {});

            if(votersList.length >= max_votes) {
                if(!player) return await interaction.followUp({
                    embeds: [client.embed().setColor(color).setDescription(`The vote skipping has been canceled due to player not found.`)]
                }).catch(() => {});

                if(!player.queue) return await interaction.followUp({
                    embeds: [client.embed().setColor(color).setDescription(`The vote skipping has been canceled due to player not found.`)]
                }).catch(() => {});

                if(!player.queue.current) return await interaction.followUp({
                    embeds: [client.embed().setColor(color).setDescription(`The vote skipping has been canceled due to nothing is playing right now.`)]
                }).catch(() => {});

                const track = player.queue.current;

                if(!player.queue.size) {
                    let data = await db.findOne({ _id: interaction.guildId });
                    if(player.get("autoplay")) {
                        let au = await autoplay(player, client.user);
                        if(au === "failed") {
                            if(data && data.mode) {
                                player.stop();
                                await interaction.followUp({ embeds: [client.embed().setColor("BLURPLE").setDescription(`Vote Skipped [${track.title}](${track.uri})`)] }).catch(() => {});
                            } else {
                                player.destroy();
                                await interaction.followUp({ embeds: [client.embed().setColor("BLURPLE").setDescription(`Vote Skipped [${track.title}**](${track.uri}) and destroyed the player due to no more songs left in the queue.`)] }).catch(() => {});
                            };
                        } else {
                            player.stop();
                            await interaction.followUp({ embeds: [client.embed().setColor(color).setDescription(`Vote Skipped [${track.title}](${track.uri})`)] })
                        };
                    } else {
                        if(data && data.mode) {
                            player.stop();
                            await interaction.followUp({ embeds: [client.embed().setColor("BLURPLE").setDescription(`Vote Skipped [${track.title}](${track.uri})`)] }).catch(() => {});
                        } else {
                            player.destroy();
                            await interaction.followUp({ embeds: [client.embed().setColor("BLURPLE").setDescription(`Vote Skipped [${track.title}](${track.uri}) and destroyed the player due no more songs left in the queue.`)] }).catch(() => {});
                        };
                    };
                } else {
                    player.stop();
                    await interaction.followUp({ embeds: [client.embed().setColor("BLURPLE").setDescription(`Vote Skipped [${track.title}](${track.uri})`, color)] }).catch(() => {});
                };

                return collector.stop();
            };
        });
    }
}