import type { Client, EventHandler } from 'commandkit';
import { Logger } from 'commandkit/logger';
import { ActivityType } from 'discord.js';

const handler: EventHandler<'clientReady'> = async (client) => {
  Logger.info(`Logged in as ${client.user.username}!`);
  client.user.setPresence({
    activities: [
      {
        type: ActivityType.Watching,
        name: client.guilds.cache.size + " Servers!"
      }
    ]
  })

  setInterval(presence, 600000, client)
};


function presence(client: Client<true>) {
  client.user.setPresence({
    activities: [
      {
        type: ActivityType.Watching,
        name: client.guilds.cache.size + " Servers!"
      }
    ]
  })
}

export default handler;
