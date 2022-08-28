const Client = require("../../../index");
const { CommandInteraction, Permissions } = require("discord.js");
const { moveArray, intReply } = require("../../handlers/functions");

module.exports = {
    data: {
        name: "move",
        description: "To move track/bot/you tp a new position.",
        options: [
            {
                name: "track",
                description: "To move a track to new position in the queue.",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "number",
                        description: "The from position.",
                        type: "NUMBER",
                        required: true
                    },

                    {
                        name: "to",
                        description: "The to position",
                        type: "NUMBER",
                        required: true
                    }
                ]
            },

            {
                name: "bot",
                description: "To move the bot to your voice channel.",
                type: "SUB_COMMAND"
            },

            {
                name: "me",
                description: "To move you to the voice channel that the bot's in.",
                type: "SUB_COMMAND"
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
        if(!interaction.member.voice.channel) return await intReply(interaction, `You are not connected to  a voice channel to use this command.`, color);

        const player = client.player.get(interaction.guildId);
        if(!player) return await intReply(interaction, `Nothing is playing right now.`, color);

        if(player && player.state !== "CONNECTED") {
            player.destroy();
            return await intReply(interaction, `Nothing is playing right now.`, color);
        };

        if(interaction.options.getSubcommand() === "track") {
            if(!player.queue) return await intReply(interaction, `Nothing is playing right now.`, color);
            if(!player.queue.current) return await intReply(interaction, `Nothing is playing right now.`, color);
            
            if(!player.queue.size) return await intReply(interaction, `No more tracks left in the queue to move.`, color);

            let trackNumber = interaction.options.getNumber("number");
            let toPosition = interaction.options.getNumber("to");

            if(trackNumber <= 0 || trackNumber > player.queue.size) return await intReply(interaction, `You've provided an invalid track position to move.`, color);

            if(toPosition <= 0 || toPosition > player.queue.size) return await intreply(interaction, `You've provided an invalid position to move the track.`, color);

            if(trackNumber === toPosition) return await intreply(interaction, `This track is already at the position \`[ ${toPosition} ]\``, color);
            
            trackNumber = trackNumber - 1;
            toPosition = toPosition - 1;

            const movedQueue = moveArray(player.queue, trackNumber, toPosition);
            player.queue.clear();
            player.queue.add(movedQueue);

            return await intReply(interaction, `Moved track number \`[ ${trackNumber + 1} ]\` to \`[ ${toPosition + 1} ]\` in the queue.`, color);
        } else if(interaction.options.getSubcommand() === "bot") {
            if(!interaction.member.permissions.has(Permissions.FLAGS.MOVE_MEMBERS)) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

            if(interaction.member.voice.channelId === interaction.guild.me.voice.channelId) return await intReply(interaction, `You are already connected to the same voice channel as I am.`, color);

            if(!interaction.guild.me.permissionsIn(interaction.member.voice.channel).has(Permissions.FLAGS.CONNECT)) return await intReply(interaction, `I don't have enough permissions to connect to your voice channel.`, color);

            if(!interaction.guild.me.permissionsIn(interaction.member.voice.channel).has(Permissions.FLAGS.SPEAK)) return await intReply(interaction, `I don't have enough permissions to speak in your voice channel.`, color);

            player.setVoiceChannel(interaction.member.voice.channelId);
            if(player.paused && player.state === "CONNECTED") player.pause(false);

            return await intReply(interaction, `Moved me to ${interaction.member.voice.channel}`, color);
        } else if(interaction.options.getSubcommand() === "me") {
            if(!interaction.member.permissions.has(Permissions.FLAGS.MOVE_MEMBERS)) return await intReply(interaction, `You don't have enough permission to use this command.`, color);

            if(!interaction.guild.me.permissions.has(Permissions.FLAGS.MOVE_MEMBERS)) return await intReply(interaction, `I don't enough permission to execute this command.`, color);

            if(interaction.member.voice.channelId === interaction.guild.me.voice.channelId) return await intReply(interaction, `You are already connected to the same voice channel as I am.`, color);

            if(interaction.guild.me.voice.channel) await interaction.member.voice.setChannel(interaction.guild.me.voice.channel);

            return await intReply(interaction, `Moved you to ${interaction.guild.me.voice.channel}`, color);
        };
    }
}