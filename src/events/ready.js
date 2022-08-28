const Client = require("../../index");

module.exports = {
    name: "ready",
    once: true,

    /**
     * 
     * @param {Client} client 
     */

    execute: (client) => {
        console.log(`[ API ] Logged in as `, client.user.tag);
        client.player.init(client.user.id);
        
        client.user.setPresence({
            activities: [
                {
                    name: "/play",
                    type: "LISTENING"
                }
            ],
            status: "online"
        });
    }
}