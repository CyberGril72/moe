const Client = require("../../../index");
const { Player } = require("erela.js");
const { oops }  =require("../../handlers/functions");

module.exports = {
    name: "playerMove",

    /**
     * 
     * @param {Client} client 
     * @param {Player} player 
     * @param {String} oldChannel
     * @param {String} newChannel
     */

    execute: async (client, player, oldChannel, newChannel) => {
        const guild = client.guilds.cache.get(player.guild);
        if(!guild) return;
        const channel = guild.channels.cache.get(player.textChannel);

        if(oldChannel === newChannel) return;
        
        if(newChannel === null || !newChannel) {
            if(!player) return;
            if(channel) await oops(channel, `I've been disconnected from <#${oldChannel}>`);
            return player.destroy();
        };

        player.changeVoiceChannel(newChannel);
        if(player.state !== "CONNECTED") player.setVoiceChannel(newChannel);
        if(channel) await oops(channel, `Player voice channel moved to <#${player.voiceChannel}>`);
        if(player.paused) player.pause(false);
    }
}
