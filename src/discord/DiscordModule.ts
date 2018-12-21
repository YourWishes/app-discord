// Copyright (c) 2018 Dominic Masters
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { App, Module } from '@yourwishes/app-base';
import { Client, Message } from 'discord.js';
import { DiscordCommand } from './DiscordCommand';

export const CONFIG_ID = 'discord.client_id';
export const CONFIG_TOKEN = 'discord.token';
export const CONFIG_COMMAND_PREFIX = 'discord.commandPrefix';

export class DiscordModule extends Module {
  client:Client;
  token:string;
  commands:DiscordCommand[]=[];

  constructor(app:App) {
    super(app);

    //Create a discord client
    this.client = new Client();

    //Standard Listeners
    this.client.on('ready', () => this.onReady() );
    this.client.on('message', msg => this.onMessageHandleCommand(msg));
  }

  getCommandPrefix() {
    return this.app.config.get(CONFIG_COMMAND_PREFIX) || '!';
  }

  getCommand(command:string):DiscordCommand {
    if(!command || !command.length) return null;

    let cmd = command.toLowerCase();
    let aliasMatch:DiscordCommand = null;
    for(let i = 0; i < this.commands.length; i++) {
      let c = this.commands[i];
      if(c.label.toLowerCase() === cmd) return c;

      if(aliasMatch instanceof DiscordCommand) continue;
      for(let x = 0 ; x < c.aliases.length; x++) {
        if(c.aliases[x].toLowerCase() === cmd) aliasMatch = c;
      }
    }

    return aliasMatch;
  }

  addCommand(command:DiscordCommand):void {
    if(!(command instanceof DiscordCommand)) throw "Invalid Command";
    if(this.commands.indexOf(command) !== -1) return;
    this.commands.push(command);
  }

  removeCommand(command:DiscordCommand):void {
    if(!(command instanceof DiscordCommand)) throw "Invalid Command";
    let index = this.commands.indexOf(command);
    if(index === -1) return;
    this.commands.splice(index, 1);
  }


  async init():Promise<void> {
    //Check configuration has the correct keys in them.
    if(!this.app.config.has(CONFIG_ID)) throw "Missing Discord Client ID in configuration.";
    if(!this.app.config.has(CONFIG_TOKEN)) throw "Missing Discord Token in configuration.";

    //Configuration set, let's connect to the Discord servers.
    this.token = await this.client.login(this.app.config.get(CONFIG_TOKEN));
  }

  //Events
  async onReady() {}

  async onMessageHandleCommand(message:Message):Promise<void> {
    if(!(message instanceof Message)) return;
    if(!message.content.replace(/\s/g, '').length) return;

    //Is Command?
    if(!message.content.startsWith(this.getCommandPrefix())) return;

    //Let's generate our command details
    let messageArray = message.content.split(' ');
    if(!messageArray.length) return;

    //Get Label (REAL Label)
    let label = messageArray[0];
    label = label.substring(1, label.length);;
    if(!label.length) return;

    //Find Command for label
    let command = this.getCommand(label);
    if(!command) return;//TODO: Show error message?

    //Determine args (raw string)
    let args = [];
    for(let i = 1; i < messageArray.length; i++) {
      args.push(messageArray[i]);
    }

    //Exec command.
    await command.onCommand(message, label, args);
  }
}
