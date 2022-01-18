import React, { useRef, useState, useLayoutEffect } from "react";
import { Game, Scene, Text, useScene, Sprite } from "react-phaser-fiber";
import { GameOverlay } from "./game_overlay";
import { FloatingNumbersPlugin } from "./FloatingNumbersPlugin";

import { buildInitialState, wireUpGlobalState, globalState, setGlobalState, doNav} from "./state.js"

class HealthBar {
    constructor (scene, x, y, max, cur)
    {
        this.bar = new window.Phaser.GameObjects.Graphics(scene);
        this.scene = scene;

        this.x = x;
        this.y = y;
        this.value = 100;
        this.p = 76 / 100;
        this.max = max;
        this.cur = cur;

        this.draw();

        scene.add.existing(this.bar);
    }

    decrease (amount)
    {
        this.cur -= amount;

        if (this.cur < 0)
        {
            this.cur = 0;
        }

        this.draw();

        return (this.cur === 0);
    }

    draw ()
    {
        this.bar.clear();

        //  BG
        //this.bar.fillStyle(0x000000);
        //this.bar.fillRect(this.x, this.y, 80, 16);

        //  Health
        this.bar.fillStyle(0x000000);
        this.bar.fillRect(this.x + 2, this.y + 2, 76, 12);

        //if (this.value < 30)
        //{
            //this.bar.fillStyle(0xff0000);
        //}
        //else
        //{
            this.bar.fillStyle(0xa82e01);
        //}

        var d = Math.floor(this.p*(this.cur/this.max)*100);

        this.bar.fillRect(this.x + 2, this.y + 2, d, 12);
    }

    remove() {
      this.bar.destroy()
    }
}
window.HealthBar = HealthBar;

const regions = {
  1: {name: "Village", x: 1220, y: 790, icon: "worldmap_village"},
  2: {Name: "Goblin Forest", x: 1020, y: 780, text: {x: 960, y: 830, label: "Goblin Forest"}},
  3: {name: "Orc Beach", x: 920, y: 930, text: {x: 880, y: 960, label: "Orc Beach"}},
  4: {name: "Orc Fort", locked: true, x: 880, y: 1260, text: {x: 840, y: 1290, label: "Orc Fort"}},
  5: {id: 5},
  6: {id: 6},
  7: {id: 7},
}

const polymorphs = {
  1: {name: "Elf Knight", sprite: "Elf_Knight_Sword", x: 0, y: 0},
}

const monsters = {
  1: {texture: "Goblin Grunt", x: 120, y: 10},
  2: {texture: "Goblin Raider", x: 120, y: 13},
  3: {texture: "Goblin Archer", x: 120, y: 20},
  100: {texture: "Goblin Elite", x: 160, y: 15, xhp: 60},
  1000: {texture: "Boss Continental Turtle Rukkha", x: 160, y: 15, xhp: 20, yhp: -30},
}

const quests = {
  1: {name: "My first hunt", desc: "Hunt a wild boar", total: 1},
  2: {name: "Hungry Villagers", desc: "Collect Wild Boar Meat for the villagers", total: 3},
  3: {name: "Goblin Extermination", desc: "Slay goblins to prove your expertise with a weapon", total: 6},
  4: {name: "The Goblins are Smelters", desc: "Collect Ore from goblins to smith a better weapon", total: 8},
  5: {name: "Into the Orc Highlands", desc: "Slay orcs on the outskirts of the highlands", total: 10},
  6: {name: "The Krak Klan Orcs", desc: "Collect Krak Klan Orc Emblems", total: 10},
  7: {name: "An Orc Shield is better", desc: "Collect Wood from Orcs to craft a shield", total: 10},
  8: {name: "Keeper of the Gates", desc: "Prove your worth for passage by defeating a Orc Chieftain", total: 1},
  100: {name: "Goblin King", desc: "End the rein of the Goblin King", total: 1},
}

function move_knight(area, setKnightPoint) {
  if (window.infight)
    return
  var x = regions[area].x
  var y = regions[area].y
  setKnightPoint([x+10, y-78])
  setGlobalState({location: area, x: x+10, y: y-78})
}

function proc_damage(x, y, text, color) {
  window.FloatingNumbersPlugin.createFloatingText({
      textOptions: {
        fontFamily: 'shrewsbury',
        fontSize: 31,
        color: color,
        strokeThickness: 2,
        fontWeight: "bold",
        stroke: "#000000",
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#000',
          blur: 4,
          stroke: true,
          fill: false
        }
      },
      text: text,
      align: "top-centerz",
      parentObject: {x: x, y: y},
      x: x,
      y: y,
      animation: "up",
      animationEase: "Linear",
      timeToLive: 600,
      animationDistance: 60
  });
}
window.proc_damage = proc_damage

function proc_miss(x, y) {
  proc_damage(x, y, "miss", "#ffffff")
}
window.proc_miss = proc_miss

function proc_char_damage(x, y, amount) {
  proc_damage(x, y, `${amount}`, "#ff0000")
}
window.proc_char_damage = proc_char_damage

function proc_npc_damage(x, y, amount) {
  proc_damage(x, y, `${amount}`, "#e5ad0e")
}
window.proc_npc_damage = proc_npc_damage

export default function App() {
  const [s, hook_setGlobalState0] = useState(buildInitialState());
  wireUpGlobalState(s, hook_setGlobalState0);

  const [count, setCount] = useState(0);
  const [[kx,ky], setKnightPoint] = useState([1230, 710]);

  var mob = s.mob;

  return ([
    <GameOverlay />,
    <Game width={3072} height={3072}>
      <Scene 
        sceneKey="main"
        onPreload={scene => {
          window.scene = scene;
          window.FloatingNumbersPlugin = new FloatingNumbersPlugin(scene)
          scene.load.image('worldmap', '/assets/nc/map_hi_iso.png')
          scene.load.image('worldmap_village', '/assets/nc/Com_Icn_Map_VillageOn.png')
          scene.load.image('worldmap_field', '/assets/nc/Com_Icn_Map_FieldOn.png')
          scene.load.image('worldmap_field_off', '/assets/nc/Com_Icn_Map_FieldOff.png')
          scene.load.image('worldmap_question', '/assets/qmark2.png')

          scene.load.image('Elf_Knight_Sword', '/assets/battler/side/Elf_Knight_Sword.png')
          scene.load.image('Goblin Grunt', '/assets/battler/front/Goblin Grunt.png')
          scene.load.image('Goblin Raider', '/assets/battler/front/Goblin Raider.png')
          scene.load.image('Goblin Archer', '/assets/battler/front/Goblin Archer.png')
          scene.load.image('Goblin Elite', '/assets/battler/front/Goblin Elite.png')
          scene.load.image('Boss Continental Turtle Rukkha', '/assets/battler/front/Boss Continental Turtle Rukkha.png')
        }}
        renderLoading={progress => (
          <Text
            x={100}
            y={100}
            text={`Loading NEAR Knights.. ${progress}%`}
            style={{ color: 'white' }}
          />
        )}
        onWheel={e => console.log(e)}
      >

        <Sprite texture="worldmap" x={1280} y={720} />

        <Sprite texture="Elf_Knight_Sword" scale={{x: 0.48, y: 0.48}} x={kx} y={ky} />
        {mob ? <MonsterSprite id={mob.id} scale={{x: 0.48, y: 0.48}} x={kx} y={ky} /> : null}

        <ClickableSprite onClick={()=> move_knight(1, setKnightPoint)} texture="worldmap_village" scale={{x: 0.8, y: 0.8}} x={1220} y={790} />

        <ClickableSprite onClick={()=> move_knight(2, setKnightPoint)} texture="worldmap_field" scale={{x: 0.8, y: 0.8}} x={1020} y={780} />
        <Text text="Goblin Forest" x={960} y={820} />

        <ClickableSprite onClick={()=> move_knight(3, setKnightPoint)} texture="worldmap_field" scale={{x: 0.8, y: 0.8}} x={920} y={930} />
        <Text text="Orc Beach" x={880} y={960} />

        <Sprite texture="worldmap_question" scale={{x: 0.12, y: 0.12}} x={880} y={1260} />
        {/*<Sprite texture="worldmap_field_off" scale={{x: 0.8, y: 0.8}} x={880} y={1260} />
        <Text text="Orc Fort" x={840} y={1290} />*/}
      </Scene>
    </Game>
  ]);
}

export function hurt_mob(dam) {
  if (!globalState.mob)
    return;
  var {x, y, xhp, yhp} = monsters[globalState.mob.id]
  if (!xhp) { xhp = 0; }
  if (!yhp) { yhp = 0; }
  if (!window.health_bar) {
    window.health_bar = new window.HealthBar(
      window.scene, globalState.x+x-xhp-40, globalState.y-(window.mob.height/3)-yhp, 
      globalState.mob.hp_max, globalState.mob.hp_cur)
  }
  if (!dam) {
    proc_npc_damage(globalState.x+x-xhp, globalState.y-(window.mob.height/2)-yhp, "miss")
  } else {
    window.health_bar.decrease(dam)
    proc_npc_damage(globalState.x+x-xhp, globalState.y-(window.mob.height/2)-yhp, dam)
  }
}

export function hurt_char(dam) {
  if (!dam) {
    proc_char_damage(globalState.x-10, globalState.y-90, "evade")
  } else {
    setGlobalState({stat: {hp_cur: globalState.stat.hp_cur-Number(dam)}})
    proc_char_damage(globalState.x-10, globalState.y-90, dam)
  }
}

function MonsterSprite({ id, ...props }) {
  const spriteRef = useRef();
  var {x, y, texture} = monsters[id]
  props.texture = texture;

  useLayoutEffect(() => {
    const instance = spriteRef.current;
    window.mob = instance;
    if (!x) { x = 0 }
    if (!y) { y = 0 }
    instance.x += x
    instance.y += y
  }, [props.x]);

  return (
    <Sprite
      ref={spriteRef}
      {...props}
    />
  );
}


function ClickableSprite({ onClick, ...props }) {
  const spriteRef = useRef();

  useLayoutEffect(() => {
    const instance = spriteRef.current;
    if (instance) {
      instance.setInteractive().on("pointerdown", onClick);

      return () => {
        if (instance) {
          instance.off("pointerdown", onClick);
        }
      };
    }
  }, [onClick]);

  return (
    <Sprite
      ref={spriteRef}
      {...props}
    />
  );
}

function ClickableText({ onClick, ...props }) {
  const textRef = useRef();
  useLayoutEffect(() => {
    const instance = textRef.current;

    if (instance) {
      instance.on("pointerdown", onClick);

      return () => {
        if (instance) {
          instance.off("pointerdown", onClick);
        }
      };
    }
  }, [onClick]);

  return (
    <Text
      ref={textRef}
      // text game objects need an explicit shape
      interactive={{
        shape: {
          x: 0,
          y: 0,
          width: props.width,
          height: props.height
        }
      }}
      {...props}
    />
  );
}
