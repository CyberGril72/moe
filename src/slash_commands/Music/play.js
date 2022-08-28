const { CommandInteraction, Permissions, MessageEmbed, MessageActionRow } = require("discord.js");
const { intReply } = require("../../handlers/functions");
const Client = require("../../../index");
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    data: {
        name: "play",
        description: "To play songs from youtube/spotify/soundcloud etc.",
        options: [
            {
                name: "query",
                description: "The search query, name/url of the song.",
                type: "STRING",
                required: true
            }
        ]
    },

    dj: false,

    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {String} color 
     * @returns {Promise<void>}
     */

    execute: async (client, interaction, color) => {
        if(!interaction.replied) await interaction.deferReply().catch(() => {});
        const query = interaction.options.getString("query");
        if(!query) return await intReply(interaction, `Please provide a search query.`, color);

        if(!interaction.member.voice.channel) return await intReply(interaction, `You are not connected to a voice channel to use this command.`, color);

        if(!interaction.guild.me.permissions.has([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK])) return await intReply(interaction, `I don't have enough permission to execute this command.`, color);

        let player = client.player.get(interaction.guildId);
        if(!player) player = client.player.create({ guild: interaction.guildId, textChannel: interaction.channelId, voiceChannel: interaction.member.voice.channelId, selfDeafen: true, volume: 80 });

        if(interaction.guild.me.voice.channel && interaction.guild.me.voice.channelId !== interaction.member.voice.channelId) return await intReply(interaction, `You are not connected to <#${interaction.guild.me.voice.channelId}> to use this command.`, color);

        try {
            let s = await player.search(query, interaction.user);
            if(!s) return await intReply(interaction, `Couldn't load any search results for ${query}`, color);

            if(s.loadType === "PLAYLIST_LOADED") {
                if(!player) return await intReply(interaction, `Process canceled due to player not found.`, color);
                if(player.state !== "CONNECTED") player.connect();
                if(player) player.queue.add(s.tracks);
                if(player && player.state === "CONNECTED" && !player.playing && !player.paused && player.queue.totalSize === s.tracks.length) await player.play();

                return await intReply(interaction, `Added \`[ ${s.tracks.length} ]\` track(s) from [${s.playlist.name}](${query}) to the queue.`, color);
            } else if(s.loadType === "SEARCH_RESULT") {
                if(!player) return await intReply(interaction, `Process canceled due to player not found.`, color);
                const tracks = s.tracks.slice(0, 3).map((x, i) => `> \`[ ${++i} ]\` ~ ${x.title && x.uri ? `[${x.title}](${x.uri})` : x.title}${x.duration ? ` ~ \`[ ${prettyMilliseconds(x.duration)} ]\``: ""}`);

                const embed1 = client.embed().setColor(color).setDescription(`${tracks.join("\n")}`).setAuthor({name: interaction.user.tag,iconURL: interaction.user.displayAvatarURL({ dynamic: true })}).setTitle("Select the track that you want").setFooter({text: `If none selected, then it will load the first track.`});

                const one = client.button().setCustomId("play_cmd_select_one").setLabel("1").setStyle("PRIMARY");
                const two = client.button().setCustomId("play_cmd_select_two").setLabel("2").setStyle("PRIMARY");
                const three = client.button().setCustomId("play_cmd_select_three").setLabel("3").setStyle("PRIMARY");

                await interaction.editReply({ embeds: [embed1], components: [new MessageActionRow().addComponents(one, two, three)] }).catch(() => {});

                const collector = interaction.channel.createMessageComponentCollector({
                    filter: (b) => b.user.id === interaction.user.id ? true : false && b.deferUpdate().catch(() => {}),
                    max: 1,
                    time: 60000,
                    idle: 60000/2
                });

                collector.on("end", async (collected) => {
                    await interaction.editReply({ components: [new MessageActionRow().addComponents(one.setDisabled(true), two.setDisabled(true), three.setDisabled(true))] }).catch(() => {});

                    if(player && collected.size <= 0) {
                        if(player.state !== "CONNECTED") player.connect();
                        player.queue.add(s.tracks[0]);
                        if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                        return await interaction.editReply({ embeds: [embed1.setDescription(`Added [${s.tracks[0].title}](${s.tracks[0].uri}) to the queue by default.`)] }).catch(() => {});
                    };
                });

                collector.on("collect", async (button) => {
                    if(!button.deferred) await button.deferUpdate().catch(() => {});
                    if(!player && !collector.ended) return collector.stop();
                    if(player.state !== "CONNECTED") player.connect();

                    if(button.customId === one.customId) {
                        player.queue.add(s.tracks[0]);
                        if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                        return await interaction.editReply({ embeds: [embed1.setDescription(`Added [${s.tracks[0].title}](${s.tracks[0].uri}) to the queue.`)] }).catch(() => {});
                    } else if(button.customId === two.customId) {
                        player.queue.add(s.tracks[1]);
                        if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                        return await interaction.editReply({ embeds: [embed1.setDescription(`Added [${s.tracks[1].title}](${s.tracks[1].uri}) to the queue.`)] }).catch(() => {});
                    } else if(button.customId === three.customId) {
                        player.queue.add(s.tracks[3]);
                        if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                        return await interaction.editReply({ embeds: [embed1.setDescription(`Added [${s.tracks[3].title}](${s.tracks[3].uri}) to the queue.`)] }).catch(() => {});
                    } else return;
                });
            } else if(s.loadType === "TRACK_LOADED") {
                if(!player) return await intReply(interaction, `Process canceled due to player not found.`, color);
                if(player.state !== "CONNECTED") player.connect();
                player.queue.add(s.tracks[0]);
                if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                return await intReply(interaction, `Added [${s.tracks[0].title}](${s.tracks[0].uri}) to the queue.`, color);
            } else {
                if(player && !player.queue.current) player.destroy();
                return await intReply(interaction, `No results found for ${query}`, color);
            };
        } catch (e) {
            return await intReply(interaction, `The player's are currently unavaible. If you find this annoying, please report this in the [support server](${client.config.links.server}).`, color);
        }
    }
}