import { DiscordCommand } from './DiscordCommand';
import { DiscordModule } from './DiscordModule';
import { IDiscordApp } from './../app/';
import { App } from '@yourwishes/app-base';
import { Message } from 'discord.js';

//Dummy Classes
const DummyAppClass = class extends App implements IDiscordApp {
  discord:DiscordModule;
};
const DummyCommandClass = class extends DiscordCommand {
  testCommand:jest.Mock;

  async onCommand(message:Message, label:string, args:string[]) {
    this.testCommand(message,label,args);
  }
}

//Dummy Objects
const DummyApp = new DummyAppClass();
const DummyDiscord = new DiscordModule(DummyApp);


//Tests
describe('DiscordCommand', () => {
  it('should require a real discord module', () => {
    expect(() => new DummyCommandClass(null, 'test')).toThrow();
  });

  it('should require a label of length greater than zero', () => {
    expect(() => new DummyCommandClass(DummyDiscord, '')).toThrow();
    expect(() => new DummyCommandClass(DummyDiscord, 'teest')).not.toThrow();
  });

  it('should require all aliases to have length greater than zero', () => {
    expect(() => new DummyCommandClass(DummyDiscord, 'test', [''])).toThrow();
    expect(() => new DummyCommandClass(DummyDiscord, 'test', ['a', ''])).toThrow();
    expect(() => new DummyCommandClass(DummyDiscord, 'test', ['a', 'b'])).not.toThrow();
    expect(() => new DummyCommandClass(DummyDiscord, 'test', ['', 'b'])).toThrow();
  });
});
