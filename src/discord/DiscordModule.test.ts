import { DiscordCommand } from './DiscordCommand';
import { DiscordModule } from './DiscordModule';
import { IDiscordApp } from './../app/';
import { App } from '@yourwishes/app-base';
import { Message } from 'discord.js';


//Dummy Classes
const DummyAppClass = class extends App implements IDiscordApp {
  discord:DiscordModule;

  constructor() {
    super();
    this.config.data = this.config.data || {};

    //Expected configuration
    this.config.data['discord'] = { client_id: '1', token: '1', commandPrefix: '/' };
  }
};

const DummyCommandClass = class extends DiscordCommand {
  testCommand:jest.Mock;

  async onCommand(message:Message, label:string, args:string[]) {
    this.testCommand(message,label,args);
  }
}

//Dummy Objects
const DummyApp = new DummyAppClass();


//Tests
describe('DiscordModule', () => {
  it('should require a valid app', () => {
    expect(() => new DiscordModule(null)).toThrow();
    expect(() => new DiscordModule(DummyApp)).not.toThrow();
  });

  it('should create a discord.js client object', () => {
    let module = new DiscordModule(DummyApp);
    expect(module.client).toBeDefined();
  });
});

describe('init', () => {
  it('should require the config to be set correctly', async () => {
    //Setup the dummy.
    let newDummyApp = new DummyAppClass();
    let module = new DiscordModule(newDummyApp);
    newDummyApp.config.data['discord'] =  {};

    await expect(module.init()).rejects.toThrow();
    newDummyApp.config.data['discord'].client_id =  '1';
    await expect(module.init()).rejects.toThrow();
  });

  it('should attempt a login', async () => {
    let module = new DiscordModule(DummyApp);
    let mock = jest.fn();
    module.client.login = async () => mock();

    await expect(module.init()).resolves;
    expect(mock).toHaveBeenCalled();
  });
});

describe('addDiscordCommand', () => {
  it('should require a real command', () => {
    let module = new DiscordModule(DummyApp);
    expect(() => module.addDiscordCommand(null)).toThrow();
  });

  it('should add a command', () => {
    let module = new DiscordModule(DummyApp);
    let dummyCommand = new DummyCommandClass(module, 'test');
    expect(() => module.addDiscordCommand(dummyCommand)).not.toThrow();
    expect(module.commands).toContain(dummyCommand);
  });

  it('should not double up', () => {
    let module = new DiscordModule(DummyApp);
    let dummyCommand = new DummyCommandClass(module, 'test');
    let dummyCommand2 = new DummyCommandClass(module, 'test2');

    module.addDiscordCommand(dummyCommand);
    expect(module.commands).toContain(dummyCommand);
    expect(module.commands).toHaveLength(1);
    module.addDiscordCommand(dummyCommand);
    expect(module.commands).toHaveLength(1);
    module.addDiscordCommand(dummyCommand2);
    expect(module.commands).toHaveLength(2);
  });
});

describe('removeDiscordCommand', () => {
  it('should require a real command', () => {
    let module = new DiscordModule(DummyApp);
    expect(() => module.removeDiscordCommand(null)).toThrow();
  });

  it('should remove a command', () => {
    let module = new DiscordModule(DummyApp);
    let dummyCommand = new DummyCommandClass(module, 'test');
    let dummyCommand2 = new DummyCommandClass(module, 'test2');

    module.addDiscordCommand(dummyCommand);
    module.addDiscordCommand(dummyCommand2);
    expect(module.commands).toHaveLength(2);
    expect(() => module.removeDiscordCommand(dummyCommand)).not.toThrow();

    expect(module.commands).toHaveLength(1);
    expect(module.commands).not.toContain(dummyCommand);
    expect(module.commands).toContain(dummyCommand2);

    module.addDiscordCommand(dummyCommand);
    module.removeDiscordCommand(dummyCommand2);
    module.removeDiscordCommand(dummyCommand2);
    expect(module.commands).toHaveLength(1);
    expect(module.commands).toContain(dummyCommand);
    expect(module.commands).not.toContain(dummyCommand2);
  });
});

describe('getCommandPrefix', () => {
  it('should return the command prefix from the config', () => {
    let module = new DiscordModule(DummyApp);
    expect(module.getCommandPrefix()).toEqual('/');
  });

  it('should default to !', () => {
    let newDummyApp = new DummyAppClass();
    let module = new DiscordModule(newDummyApp);
    newDummyApp.config.data['discord'] =  {};

    expect(module.getCommandPrefix()).toEqual('!');
  });
});

describe('getCommand', () => {
  let module = new DiscordModule(DummyApp);
  let dummyCommandTest = new DummyCommandClass(module, 'test', ['t', 'e']);
  let dummyCommandPing = new DummyCommandClass(module, 'ping', ['p', 'po', 'help']);
  let dummyCommandHelp = new DummyCommandClass(module, 'help', ['e', 'test']);
  let dummyCommandTest2 = new DummyCommandClass(module, 'test', []);
  module.addDiscordCommand(dummyCommandTest);
  module.addDiscordCommand(dummyCommandPing);
  module.addDiscordCommand(dummyCommandHelp);
  module.addDiscordCommand(dummyCommandTest2);

  it('should match the command by label', () => {
    expect(module.getCommand('ping')).toEqual(dummyCommandPing);
    expect(module.getCommand('help')).toEqual(dummyCommandHelp);
  });

  it('should match the command by alias', () => {
    expect(module.getCommand('p')).toEqual(dummyCommandPing);
    expect(module.getCommand('t')).toEqual(dummyCommandTest);
  });

  it('should choose the first registered command', () => {
    expect(module.getCommand('test')).toEqual(dummyCommandTest);
    expect(module.getCommand('e')).toEqual(dummyCommandTest);
  });

  it('should be case insensitive', () => {
    expect(module.getCommand('TesT')).toEqual(dummyCommandTest);
    expect(module.getCommand('PINg')).toEqual(dummyCommandPing);
    expect(module.getCommand('E')).toEqual(dummyCommandTest);
    expect(module.getCommand('pO')).toEqual(dummyCommandPing);
  });

  it('should return null if no command is found', () => {
    expect(module.getCommand('herwefs')).toBeNull();
  });

  it('should return null if no command is entered', () => {
    expect(module.getCommand(null)).toBeNull();
    expect(module.getCommand('')).toBeNull();
  });
});

describe('loadPackage', () => {
  it('should be loaded and return the necessary data when the module is constructed', () => {
    expect(new DiscordModule(DummyApp).package).toHaveProperty('name', '@yourwishes/app-discord');
  });
});
