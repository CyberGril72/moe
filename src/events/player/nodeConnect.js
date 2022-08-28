const { Node } = require("erela.js");
const Client = require("../../../index");
const { WebhookClient } = require("discord.js");
const db = require("../../utils/schemas/247");
module.exports = {
    name: "nodeConnect",

    /**
     * 
     * @param {Client} client 
     * @param {Node} node 
     */

    execute: async (client, node) => {
      
        console.log(`[ LAVALINK NODE ${node.options.identifier} CONNECTED ]`);
        console.log("Auto Reconnect Collecting player 24/7 data");
        const maindata = await db.find()
        console.log(`Auto Reconnect found ${maindata.length ? `${maindata.length} queue${maindata.length > 1 ? 's' : ''}. Resuming all auto reconnect queue` : '0 queue'}`);
        for (let data of maindata) {
            const index = maindata.indexOf(data);
            setTimeout(async () => {
          let text = client.channels.cache.get(data.textChannel)
          let guild = client.guilds.cache.get(data._id);
          let voice = client.channels.cache.get(data.voiceChannel)
         if (!guild || !text || !voice) return data.delete()
              player = client.player.create({ 
                    guild: guild.id, 
                    textChannel: text.id, 
                    voiceChannel: voice.id, 
                    selfDeafen: true, 
                    volume: 80 
                  });
               if(player && player.state !== "CONNECTED") player.connect();
               }
            ), index * 5000}
        let channel = new WebhookClient({url: client.config.hooks.lavalink.url});
        if(channel) return await channel.send({ content: `**${node.options.identifier}** have been connected!` }).catch(() => {});
        
    }
}
