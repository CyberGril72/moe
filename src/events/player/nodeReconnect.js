const { Node } = require("erela.js");
const Client = require("../../../index");
const { WebhookClient } = require("discord.js");

module.exports = {
    name: "nodeReconnect",

    /**
     * 
     * @param {Client} client 
     * @param {Node} node 
     */

    execute: async (client, node) => {
        console.log(`[ LAVALINK NODE ${node.options.identifier} RECONNECTED ]`);

        let channel = new WebhookClient({url: client.config.hooks.lavalink.url});
        if(channel) return await channel.send({ content: `**${node.options.identifier}** have been reconnected!` }).catch(() => {});
    }
}
